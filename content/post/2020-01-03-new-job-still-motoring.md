+++
date = "2020-01-03T00:20:00-05:00"
title = "New job, still motoring along"
author = "AJ Frantz"
+++

Gosh it's been a while...

Zygote's progress got interrupted in mid-November for a few weeks of interview
prep, then interviews... then more intereviews... oh, and Thanksgiving.  It was
a busy month.

I'm happy to say that I've accepted a job with
[Zipline](https://flyzipline.com) and I'll be starting up work there in just a
few days.  Saving lives with embedded systems!

If I have any say in it, though, the Zygote project won't die off.  I've
already gotten things to where they can spin a motor, so really it's all just
refactoring at this point!

<!--more-->

## Hardware

In early December I brushed off my (rusty) PCB design skills in order to get
started with Zygote's board design.  I picked up
[KiCad](https://kicad-pcb.org/), which seems like a _passable_ piece of
software, and I laid out a relatively ambitious four-layer board including the
planned STM32G474, a
[LAN9250](https://www.microchip.com/wwwproducts/en/LAN9250) for my much-desired
Ethernet support, and the [DRV8353RS](http://www.ti.com/product/DRV8353R) for
the gate driver.

It took me about 5 days to get everything wired up, but unfortunately I ran out
of time before having to run off to holiday celebrations and not getting things
submitted to MacroFab in time to have a prototype waiting for me when I got back.

Things went from bad to worse when I realized how much MacroFab assembly costs:
the LAN9250 costs $5.82 on Mouser, but MacroFab charges $7.46 for the part +
$22.25 for the labor.  That means what I thought was a bit of a silly splurge
turned into $30 BOM item!

Multiply that same pattern across a bunch of discretes which _should_ be nickle
and dimes but turn into a whole lot more than that... I had racked up something
like a $300 bill for a single board.

I've done the solder paste and stencil route before, but I don't currently have
access to a reflow oven, so I'll probably still bank on MacroFab for early
prototypes.  However, I need to go back and rip out a few things to make that
more affordable for the time being--likely meaning giving up on Ethernet for
now.

## On EDA tools

Autorouters for PCB design tools get a lot of hate--and certainly, when applied
blindly, they tend to do silly things--but something which resonated with me
from [Andrej Karpathy's Software 2.0
piece](https://medium.com/@karpathy/software-2-0-a64152b37c35) was less about
_machine learning_ and more about the absurd computational horsepower each of
us has available to us and how we should leverage that to work smarter.  There
are many aspects of PCB design software that amount to digitalized version of
old-school 2D drafting processes which could be much less tediously undertaken
by machines.

I don't think I mean the _most_ tedious bits, like having to draw footprints
for weird one-off TI parts, but the overall "design" of a PCB.  Frequently, if
an autorouter runs a trace off to Kingdom Come in order to make ends meet,
the fastest fix is repositioning the endpoints: either, rotating or
physically moving the relevant ICs in relation to one another, or sometime
even more simply, re-assigning which pin is used.

Think about it this way: most of my ADC channels are interchangable.  I might
specifically want to constrain a channel to a "fast input" but I probably don't
care if motor phases (a, b, c) are connected to ADCs (1, 2, 3) or (3, 4, 5) or
(3, 5, 1), etc.  All "schematic capture" processes I've seen to date largely
over-specify the exact connectivity of a design (i.e. you assign a specific pin
to a net) rather than specifying an intent and letting the software optimize
the design for fitness.

It's not like this is even the exceptional case: _most_ of the time I don't
care which GPIO a function is assigned to, which specific timer module drives
an output, etc.  Moreover, the hardest part of "PCB layout" are generally
things which have to be "iterated" on in order to get the design into a
reasonable space in the first place.  Fitness criteria which are critical to
the design are encoded into the schematic as barely more than "comments" are
used in code ("put this cap close to pin 5," or "keep analog channels away from
this switching inductor").

...it's a huge diversion from making a thing which actually works, so I
probably can't explore this idea right now, but somewhere tickling around the
back of my head is the desire for an EDA tool that lets me explicitly express
my design in terms of the things I _actually_ care about, and then automagics
the rest away.  I've got better things to do than run transmission line
calculations for every trace on my board: that's the kind of thing computers
are good for.

## The remaining software bits

From a personal perspective I'm relatively convinced that Rust is 100%
officially definitely usable in a deeply embedded, hard real-time project.
I'll probably advocate for doing so in my new job.  There _are_ a few (perhaps
non-obvious) things I've discovered along the way though, so I'll need to write
a few posts discussing it, if for no other reason than to have something to
point at during my advocacy.  Here's an outline:

 * Register access: discussed previously, I think we can do better than `svd2rust`.
 * Synchronization: or rather, how to avoid it from slowing everything down all the time.
 * Math: `#![no_std]` Rust is not very good at it right now.
 * Buffers: where should they go?  The borrow checker has opinions.
 * C++ patterns that don't work in Rust: places I keep bumping my head.
