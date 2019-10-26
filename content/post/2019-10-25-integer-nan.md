+++
date = "2019-10-25T15:00:00-04:00"
title = "Integer NaN in Rust"
author = "AJ Frantz"
+++

Zygote has been kicking along in the background--it can (slowly, open-loop)
spin a motor now!--and I'll have a bunch to say on that soon, but for now the
experiment is far from over.  Today I want to just talk about one cool little
thing about Rust that I learned along the way.

Rust [has a](https://doc.rust-lang.org/std/option/) widely used `Option` type
with [great language
support](https://doc.rust-lang.org/book/ch06-02-match.html#matching-with-optiont),
and using it prevents a whole class of errors commonly encountered in C++.  As
a bare metal, cycle-counting aficionado I see these cool features and can't
help but wonder "Sure, but what does it cost?"

It turns out Rust also implements a "null pointer optimization" which allows it
to represent an `Option` of pointer types _exactly_ like you would in C++--as a
simple pointer, but with the benefit that the programmer is forced to check it
properly.  It doesn't even stop there!  Other types with "invalid" encodings
can be optimized down to smaller representations, too.

So, how about a common use case for systems using limited communication
bandwidth: integer values with a not-a-number canary?  It turns out we can get
the same optimization to fire!

<!--more-->

## Background

There's a (surprisingly common) niche of system design where you both highly
care about accuracy but don't have a ton of bandwidth available--think about
devices with 12-bit ADCs hooked up via a CAN bus, for example.  If the signal
you're measuring is sometimes unavailable (maybe it can only be measured in
certain modes), how do you represent it on the wire?

Obviously a 12-bit integer works well to cover the range of measured values,
but in particular, what should you send if it's not available at all?  You have
two options: out-of-band indication, or in-band indication.  If you choose
out-of-band, you'd indicate 'mode' / 'validity' somewhere else, and then
populate the field with some filler--usually just zero, or maybe the
last-measured value.  This "costs" an extra bit if you weren't planning to send
mode along already, and moreover, if code just blindly reads the value without
checking the mode first, you can accidentally read a value that's stale or
incorrect.

The most common in-band alternative is to pick a single integer value and
reserve it to mean "not-a-number" / "signal not available" -- the usual choice
being the _maximum_ possible value for the field (i.e. `0xfff` for a 12-bit
field).  The value is near saturation anyway, so the odds that your system is
_designed_ to operate up there are low.  It requires no extra data, and when
read in isolation it's "supposedly" easier to avoid making computational
errors.

Supposedly gets scare quotes because if you just stuff the value into a raw
integer, no programming language will give you a ton of protection--you might
add/subtract/multiply/divide it without further thought.  You could "promote"
the values into floating point numbers on either side of the wire--floats have
a native `NaN` representation--but that requires casting integer -> float which
increases size, plus there still exist systems without hardware floating point.
Plus, you can use `NaN` floats by accident just as easily, and worse they'll
silently taint all downstream computations.

## A Rusty Approach

What we really want is to represent things as a possibly-absent value:
`Option<u16>`.  We can compare against the invalid value when we deserialize
the integer off-the-wire, and use it robustly internally.

```rust
pub fn deserialize(raw: u16) -> Option<u16> {
    if raw > 0xffe {
        return None;
    }
    Some(raw)
}
```

If we visit [our good friend godbolt](https://rust.godbolt.org), we see this
compiles into something like the following:

```
example::deserialize:
        mov     r1, r0
        uxth    r2, r0
        movs    r0, #0
        movw    r3, #4095
        cmp     r2, r3
        it      lo
        movlo   r0, #1
        bx      lr
```

Our input parameter is in `r0`, our output is in (`r0`, `r1`), represented as
(`Some`/`None` flag, value).  We immediately copy the value into `r1`--if we
return `None`, it doesn't matter what it was anyway--and then check if the
value is in our allowed range, setting `r0 = 0` if not, or to `1` if it is.
Straightforward, but note that our return value is now in two registers, and if
we were storing it to RAM we'd have to allocate
`std::mem::size_of::<Option<u16>>() = 4` bytes, double the normal size.

We see this again when we're accessing the value, which we can do by either
preserving the optiony-ness or by assuming a default value if the input was not
available.  We'll apply a scale and an offset, as one might do with a typical
ADC calibration:

```rust
pub fn mapping_use(v: Option<u16>) -> Option<u16> {
    v.map(|x| 2 * x + 1)
}

pub fn default_use(v: Option<u16>) -> u16 {
    2 * v.unwrap_or(0) + 1
}
```

```
example::mapping_use:
        lsls    r1, r1, #1
        uxth    r0, r0
        adds    r1, #1
        cmp     r0, #0
        it      ne
        movne   r0, #1
        bx      lr

example::default_use:
        lsls    r1, r1, #1
        adds    r1, #1
        lsls    r0, r0, #16
        it      eq
        moveq   r1, #1
        mov     r0, r1
        bx      lr
```

Seven instruction in both cases; we see the arithmetic operations occurring
against `r1` (the possibly-valid value), intermingled with checks of the `r0`
register to decide how to populate the result.  For some reason LLVM randomly
decides to explicitly compare against zero or shift bits off the left side of
the integer, but hey, it works either way.  Basically we conduct the math
operation unconditionally, and mark the result as `Some` after the fact if it
was valid.

As an overall strategy this wasn't awesome: we did successfully wrap the value
so that it was impossible to accidentally use an invalid value in the arithmetic
operation, but the solution is larger in memory than the raw integer, and we
have this additional logic to populate the validity flag hanging around
everywhere.  Certainly not "zero cost" as abstractions go.

## Honey I Shrunk the Option

However!  We can play the same null pointer optimization game that Rust does
elsewhere by using a magical type `NonZeroU16`.  This type promises that a `0`
value will never be used in the field, and allows the compiler to do the magic
optimizations for us.  Now, unfortunately it isn't `MaxValueU16`: we'll have to
shift our "valid" values from 0-4094 to 1-4095 in order to placate the
optimizer gods.  That sounds like _more_ work, not less, but let's try it out
anyway.

```rust
use core::num::NonZeroU16;

pub fn deserialize(raw: u16) -> Option<NonZeroU16> {
    if raw > 0xffe {
        return MaybeValue(None);
    }
    NonZeroU16::new(raw + 1)
}
```

```
example::deserialize:
        uxth    r1, r0
        adds    r0, #1
        movw    r2, #4094
        cmp     r1, r2
        it      hi
        movhi   r0, #0
        bx      lr
```

Other than LLVM randomly inverting the conditional that it generates for some
reason, this looks pretty similar to the `deserialize` we saw previously, but
with one difference.  While we had to do "more" work, we actually shaved an
instruction: basically, the code always has to "move" the value to its final
location (either in `r1` as before, or as `r0 = r0 + 1` in the latter case),
but "add 1" is pretty much the same as a move instruction, so that comes for
free.  Because the newer version is able to optimize the representation such
that it only uses `r0`, it doesn't have to spend that extra instruction setting
up `r1`.  As a bonus, `std::mem::size_of::<MaybeValue>() = 2` bytes--we got our
space back!

How about the cost-to-access?

```rust
pub fn mapping_use(v: Option<NonZeroU16>) -> Option<NonZeroU16> {
    v.and_then(|shifted| {
        let normal = shifted.get() - 1;
        let result = 2 * normal + 1;
        NonZeroU16::new(result + 1)
    })
}

pub fn default_use(v: Option<NonZeroU16>) -> u16 {
    2 * v.map_or(0, |shifted| shifted.get() - 1) + 1
}
```

```
example::mapping_use:
        lsls    r0, r0, #1
        bx      lr

example::default_use:
        mov.w   r1, #-1
        add.w   r1, r1, r0, lsl #1
        lsls    r0, r0, #16
        it      eq
        moveq   r1, #1
        mov     r0, r1
        bx      lr
```

Well then... one of those is certainly unexpected!

`default_use` looks pretty familiar--we have some extra work going on, but the
instruction count comes out the same as before.  Some of this has to do with
ARM being pretty awesome and my choice of operation being a bit lucky: the
`lsls r1, r1, #1` operation from the work above simply became `add.w r1, r1,
r0, lsl #1`--subtracting 1 _and_ accomplishing the shift at the same time.  The
rest of the basic structure is the same, though.

`mapping_use` surprised me!  It turns out that I got _even luckier_ with this
one.  Given the scaling I chose we wound up with:

<center>
<style>
    .pretty-table table {
        table-layout:fixed;
        border-collapse: collapse;
        border: 3px solid black;
        width: 70%;
    }
    .pretty-table thead {
        background-color: #999999;
        border: 1px solid black;
    }
    .pretty-table tbody tr:nth-child(odd) {
        background-color: #dddddd;
    }
    .pretty-table thead th:nth-child(1) {
        width: 40%;
    }
    .pretty-table thead th:nth-child(2) {
        width: 20%;
    }
    .pretty-table thead th:nth-child(3) {
        width: 20%;
    }
    .pretty-table thead th:nth-child(4) {
        width: 20%;
    }
    .pretty-table tbody td {
        text-align: center;
    }
</style>
<div class="pretty-table">

`r0` value | logical value | logical result | `r0` return
-----------|---------------|----------------|------------
     0     |    None       |   None         |     0
     1     |      0        |      1         |     2
     2     |      1        |      3         |     4
     3     |      2        |      5         |     6

</div>
</center>

And so on.  That turns into a single instruction!

## Less Cheating

Ok, while I didn't chose those values thinking that it would simplify down to
something so fancy in advance, it's some impressive work by LLVM.  Let's try
something else that has less chance of bias--scaling into volts.  I know I pooh
poohed floats above, but taking ADC counts -> float is still a reasonable
transform to want to do.  I'll just throw all the samples at you at once:

```rust
pub fn to_volts(v: u16) -> f32 {
    (v as f32) * 3.3 / 4095.0
}

pub fn naked(v: u16) -> Option<f32> {
    if v > 0xffe {
        return None;
    }
    Some(to_volts(v))
}

pub fn raw_mapped(v: Option<u16>) -> Option<f32> {
    v.map(to_volts)
}

pub fn raw_defaulted(v: Option<u16>) -> f32 {
    to_volts(v.unwrap_or(0))
}

pub fn nz_mapped(v: Option<NonZeroU16>) -> Option<f32> {
    v.and_then(|shifted| Some(to_volts(shifted.get() - 1)))
}

pub fn nz_defaulted(v: Option<NonZeroU16>) -> f32 {
    v.map_or(0.0, |shifted| to_volts(shifted.get() - 1))
}
```

This yields:

```
example::naked:
        uxth    r0, r0
        movw    r1, #4094
        cmp     r0, r1
        bls     .LBB5_2
        movs    r0, #0
        bx      lr
.LBB5_2:
        vmov    s0, r0
        vldr    s2, .LCPI5_0
        vcvt.f32.u32    s0, s0
        vldr    s4, .LCPI5_1
        vmul.f32        s0, s0, s2
        vdiv.f32        s0, s0, s4
        movs    r0, #1
        bx      lr
.LCPI5_0:
        .long   1079194419
.LCPI5_1:
        .long   1166012416

example::raw_mapped:
        lsls    r0, r0, #16
        beq     .LBB1_2
        uxth    r0, r1
        vmov    s0, r0
        vldr    s2, .LCPI1_0
        vcvt.f32.u32    s0, s0
        vldr    s4, .LCPI1_1
        vmul.f32        s0, s0, s2
        vdiv.f32        s0, s0, s4
        movs    r0, #1
        bx      lr
.LBB1_2:
        movs    r0, #0
        bx      lr
.LCPI1_0:
        .long   1079194419
.LCPI1_1:
        .long   1166012416

example::raw_defaulted:
        uxth    r0, r0
        cmp     r0, #0
        it      eq
        moveq   r1, r0
        uxth    r0, r1
        vmov    s0, r0
        vldr    s2, .LCPI2_0
        vcvt.f32.u32    s0, s0
        vldr    s4, .LCPI2_1
        vmul.f32        s0, s0, s2
        vdiv.f32        s0, s0, s4
        bx      lr
.LCPI2_0:
        .long   1079194419
.LCPI2_1:
        .long   1166012416

example::nz_mapped:
        lsls    r1, r0, #16
        beq     .LBB3_2
        subs    r0, #1
        uxth    r0, r0
        vmov    s0, r0
        vldr    s2, .LCPI3_0
        vcvt.f32.u32    s0, s0
        vldr    s4, .LCPI3_1
        vmul.f32        s0, s0, s2
        vdiv.f32        s0, s0, s4
        movs    r0, #1
        bx      lr
.LBB3_2:
        movs    r0, #0
        bx      lr
.LCPI3_0:
        .long   1079194419
.LCPI3_1:
        .long   1166012416

example::nz_defaulted:
        lsls    r1, r0, #16
        beq     .LBB4_2
        subs    r0, #1
        uxth    r0, r0
        vmov    s0, r0
        vldr    s2, .LCPI4_1
        vcvt.f32.u32    s0, s0
        vldr    s4, .LCPI4_2
        vmul.f32        s0, s0, s2
        vdiv.f32        s0, s0, s4
        bx      lr
.LBB4_2:
        vldr    s0, .LCPI4_0
        bx      lr
.LCPI4_0:
        .long   0
.LCPI4_1:
        .long   1079194419
.LCPI4_2:
        .long   1166012416
```

And a brief analysis:

<center>
<style>
    .wider-table table {
        table-layout:fixed;
        border-collapse: collapse;
        border: 3px solid black;
        width: 70%;
    }
    .wider-table thead {
        background-color: #999999;
        border: 1px solid black;
    }
    .wider-table tbody tr:nth-child(odd) {
        background-color: #dddddd;
    }
    .wider-table thead th:nth-child(1) {
        width: 36%;
    }
    .wider-table thead th:nth-child(2) {
        width: 16%;
    }
    .wider-table thead th:nth-child(3) {
        width: 16%;
    }
    .wider-table thead th:nth-child(4) {
        width: 16%;
    }
    .wider-table thead th:nth-child(5) {
        width: 16%;
    }
    .wider-table tbody td {
        text-align: center;
    }
</style>
<div class="wider-table">

Version       | Total insns | `None` path | `Some` path | Critical path
--------------|-------------|-------------|-------------|--------------
naked         |        14   |     6       |     12      |     12
raw mapped    |        13   |     4       |     11      |     11
raw defaulted |        12   |    12       |     12      |     12
nz mapped     |        14   |     4       |     12      |     12
nz defaulted  |        13   |     4       |     11      |     11

</div>
</center>

I'm generally going to call this a wash.  There is an extra `subs` instruction
in the `nz_mapped` path vs. the `raw_mapped` path, but `raw_defaulted` ends up
spending one more instruction shuffling data around than `nz_defaulted`.  At
this point we start to leave the realm of "obvious" and are well into
micro-architectural issues; analyzing in any further depth is likely
unwarranted.

## Conclusion

We can leverage Rust's null pointer abstraction in places where you wouldn't
immediately expect it would be possible.  Doing so sometimes takes a bit of
extra work, but that work doesn't necessarily make things more expensive.  As
with all things optimization related, _measure_ your specific use case.

