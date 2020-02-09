+++
date = "2020-02-09T13:30:00-05:00"
title = "And we're back!"
author = "AJ Frantz"
+++

Now that I'm spun up in my new job and settling into a more regular schedule, I
was able to steal some time to work on some of my own projects for the first
time in a month or so.

The good news is that in the interim, my PCB arrived!  Scope probe for scale,
isn't it tiny and cute?

<img src="/zygote_v0.jpg">

Does it work?

<!--more-->

## Law of Headlines

Nope!

At least, not out of the box.

## Fabrication

Despite my complaints in the last post, my experience with MacroFab was pretty
solid.  I didn't get my order shipped to me on the exact day it was promised,
but it was within a day or two and I could reasonably check on its status at
any time via their webpage.

The board itself is pretty solid.  In particular, not only were there were no
obvious defects anywhere I could see, looking at things under a microscope
revealed nothing even remotely marginal.  Now, I stayed pretty well within the
lines with regards to their recommended design rules, so this isn't entirely
unexpected.  That said, it's nice when things work out, especially since
MacroFab isn't nearly the cheapest game in town; it's nice to get what you pay
for, in the _positive_ sense.

I had two main concerns in getting the first version of the board done: large
copper pours, and a few custom footprints.  Since a motor controller has to
handle relatively large currents it also has to back those high-current paths
with large amounts of copper, something which can make soldering difficult
(especially with a hand iron!).  I was pleased to see that all the solder
joints came back in great shape, and all the parts looked well flowed and well
aligned.  My custom footprints which I drafted (including my first VQFN
footprint ever) all seemed to pass muster and there's not a ton of obviously
wasted space while still allowing enough room for everything to connect up.

## Form

The first thing I needed to do when I got the board back was hook it up to
power.  I got a little over-exuberant and wired the thing straight up to an
XT90 header, which obviously jinxed things.

The first difficulty I ran into is that, despite the fact that I put the
largest holes that KiCad contains by default, they weren't _quite_ large enough
to comfortably retain the relatively large-gauge wire I wanted to hook up.
Moreover the placement of those holes wasn't entirely ideal--pretty close for
comfort--so spacing things out a bit more is in the plans for the next
revision, for sure.  Maybe I'll even try to find a better mate for the power
connector in general, because this one feels pretty janky.

The large input capacitor is clearly the sore spot on the design.  It stands
head and shoulders above the rest of the board, and its somewhat excessively
close proximity to the power connector is uncomfortable.  I'll have to think
about that, especially since I'm not even sure I provided enough bulk
capacitance as it is.

## Function

When I plugged things in, I was pleased that none of the magic smoke came out!

Alas, there didn't seem to be enough magic smoke _baked in_ to begin with,
because the very next thing I tried--enumerating the STM32 part--did not work.

There's a relatively obvious reason straight away: my 3.3 volt power supply
regulates to a super solid half a volt.  This is just dumb / rushed design work:
I chose to compute a bunch of component values by hand, didn't re-check my
numbers sufficiently to ensure that they were actually _right_, and ignored
the vendor's tool (TI's WEBENCH) which actually would have been way less
painful.  Not to mention it probably would have worked right the first time,
and its part recommender would have made BOM selections easier.

In hindsight I'm not really sure why I didn't just use their designer from
the beginning; pride, maybe?  Regardless, you live and learn, and a few
part swaps should net me a working regulator circuit.

I tried to rework some of these parts by hand, but my skill level is
insufficient.  In particular, I have an incredibly hard time getting anything
(de)soldered onto this board by hand--see my comment about large copper pours
above--and some of those parts I have to rework are super tiny bits in a
tightly packed area.  The worst part I tried to replace was the inductor: it's
huge and has relatively large and well-adhered pads.  I gave up on the hand
iron and tried hot air reworking, but started melting plastics before I got
anywhere near moving the actual part.

I _was_ able to inject 3.3 volts behind the regulator and verify that the STM32
enumerated and flashed correctly.  My setup for doing this is not particularly
ideal though, so I don't think I'll be doing a lot of development in that mode.

## Next Steps

I'm going to do as much more verification as I can stomach on this board;
perhaps I can find a better way to inject the 3.3 volt supply that makes it
easier.

I'll be doing a re-spin of the board eventually, and my wish list is something
like this:
 * Fix 3.3 volt supply passives
 * Find better solution for connecting power lines to the board
 * Revisit bulk input capacitance solution
 * Tweak design to use more MacroFab house parts
 * Consider adding a total current channel
 * Mounting holes

Depending on where the price falls out at the end of that adventure, I may also
consider a version of the board that has just the driver / switches on it in a
form factor compatible with the Nucleo-64 I have from the earlier prototype.
I'm not terribly worried about the rest of the board--and I can probably find a
way to verify most of the rest of it anyway--but if there's a cheaper
intermediate option for testing my bridge circuit I might just make use of it.
That said, most of the board cost is in the bridge, so it might not make sense;
we'll see.

