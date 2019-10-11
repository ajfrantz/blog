+++
date = "2019-10-08T11:00:00-04:00"
title = "Zygote and an experiment with Rust"
author = "AJ Frantz"
+++

I've come into a bit of free time in which to work on personal projects.  Most
of the software I've written in my adult life has been locked behind
proprietary doors of one form or another, so my plan is to use this time to
kick-start some projects which I can share more publicly.

A second motivating factor is that most of the software I've developed
professionally has been in C++.  That language is powerful and continues to
evolved, and with sufficient experience it's obviously possible to make it do
impressive and useful things.  That said, I've recently become somewhat
enamored with [Rust](https://www.rust-lang.org).  It contains many _even more_
modern niceties, and promises to contain many fewer footguns.

My passion for software is less in the pure form and more in the form that
interacts with the outside world: actuators, sensors, robotics, autonomous
vehicles, etc.  These days most projects in that vein are built around a core
component: electric motors.

So!  I've built motor controllers for secretive megacorps using C++, let's see
if I can build one in the open, using Rust!

<!--more-->

## Microcontroller Choice

Modern microcontrollers are fast, cheap, and provide almost unlimited
flexibility in a project.  There are plenty of ways to build a motor
controller, but by far [the](https://odriverobotics.com)
[most](https://vesc-project.com) [common](https://github.com/mjbots/moteus) is
to drop a microcontroller onto a PCB, wire it up to a gate driver and let
things rip.

It's been a few years since I surveyed the landscape to see who has the "best"
offering, and I'm under a lot fewer constraints now than I was then, so I took
a bit of time to look across the Infineon/ST/Microchip/NXP product lines.  In
particular, I was looking for:

 * An ARM Cortex-M chip, because I know the architecture well.  Particularly,
   one with a hardware FPU, as that blend seems to exist in a sweet spot of
   performance vs. complexity.
 * Reasonably fast, defined somewhat arbitrarily as 100 MHz or greater.  This
   is required to be able to run relatively complex control algorithms at high
   PWM rates (30+ kHz).
 * Low power, at least competitive with peers.  I'd like my battery's energy to
   go into the motor, not into the control electronics.  I didn't have a hard
   and fast rule in mind here, but this rules out e.g. 600 MHz Cortex-R4
   products.
 * Expanded temperature ratings, at least -40 to 105 C.  I don't anticipate
   _really_ pushing the thermal envelope, but sometimes a robot's geometry can
   limit your heat dissipation options.

Finally, I had two nice-to-haves: not really useful for a hobby project but
potentially relevant for other professional designs.

 * Error checking on RAM.  In a previous life this would have been a killer
   feature for dealing with high-radiation environments; for a hobby project,
   probably not super relevant.
 * Ethernet.  So many things get so much easier when you can just talk to all
   your computers _the way computers normally talk to each other_.  See also,
   the Internet.

After a lot of website browsing and datasheet reading I put together a comparison, which you 
[can find here](https://docs.google.com/spreadsheets/d/1LR7y0RZSLEj4SiwSKOOKMnzVBzSDhI5C6XbWPPWK8fs).

After a lot of debating the factors above, I think I'll be going with the
STM32G4 line.  It checks all the boxes above except Ethernet, and while that
makes me sad, it won me over on a number of other factors.

### Technical Merits

Given the matrix of important criteria provided above, the STM32G4 series
pretty much wins across the board.  The only question I wasn't able to
definitely answer--the datasheet is a bit shy here--is the "all-in" power
consumption (with all peripherals cranking away), however the CPU-only
consumption was markedly lower than for its peers.

The other peripherals in this series are all basically designed for high
performance mixed-signal projects, and they're all ~a generation ahead of the
other chips that I compared to.  While I don't have a ton of experience with
ST's _specific_ peripheral set, the reference manual skimming I did turned up
no particularly problematic areas, and I suspect things will work out fine.

### Community

The STM32 family seems to have broad popular / hobbyist appeal, and in
particular the [rust-embedded](https://github.com/rust-embedded) community
seems to have the best support around those designs.  I already own several
Nucleo and Discovery series boards, mostly given to me by various ST sales reps
over the years, and it so happens that the canonical [introduction to Rust on
micros](https://docs.rust-embedded.org/discovery/) uses one already in my
possession.

### Dev Hardware

I will eventually make a custom PCB for my project, but since I'd like to sink
my teeth into motor control with Rust right away, having a pre-packaged dev kit
is a nice bonus.  ST really shines here, as there are available dev boards for
quite cheap[^1].

In particular, there's even an [off-the-shelf
kit](https://www.st.com/en/evaluation-tools/p-nucleo-ihm03.html) for trying out
motor control too.  It's not _particularly_ close to the design I had in mind,
but it should hold me over until I get my own PCB built up.

## Drawbacks

There are three main concerns I have with the selection of the STM32G4 series.

### (No) Ethernet

I _really_ wanted Ethernet support.  The next-best serial interconnect that is
supported natively is CAN-FD, which tops out at something south of 8 Mbps,
a.k.a. more than 92% slower than a chip with an Ethernet MAC.

If we're being serious: CAN(-FD) probably has more than enough bandwidth for
command/control, and depending on the bus topology possibly simplifies the
projects that use it.  There exist
[shields](https://www.seeedstudio.com/2-Channel-CAN-BUS-FD-Shield-for-Raspberry-Pi-p-4072.html)
which should allow me to integrate e.g. an RPi computer directly to a CAN bus
easily enough.

That said, I'm a huge fan of the ability to dump every-variable-every-cycle for
debugging high speed controllers--if you can't see the problem you won't know
to fix it--and this is a limiting factor.  Unfortunately, the main mitigation I
would propose is dumping data to an SD card... alas, see the next section.

### (No) SD/MMC

The chip also doesn't native support SD card interfaces.  Or, to be more
specific: SD cards support ~two interfaces, one just a vanilla SPI interface,
and another a high-speed "SD bus" mode, which I won't be able to use.  If we
stick to the native SPI interface, we get "only" ~50 Mbps.

It might still be worth pushing data down to a card in its handicapped mode for
ease-of-extraction, or I might slap a quad-SPI flash chip on the board directly
and trickle data out via CAN.  Or, who knows, perhaps I'll get the telemetry to
fit in a CAN-FD budget.  There are options, either way.

### Debugger Support

The existing ST dev kits I have are augmented by an on-board STLINK adapter,
generally v2 or v2.1.  These are well-supported by OpenOCD, and they perform
reasonably well.

Unfortunately, the newer STM32G4 kits come with an STLINKv3-based on-board
adapter, and commonly released versions of OpenOCD don't support that version
yet.  Also, I'm going to eventually build my own boards, and I'm loathe to
build my tooling around a closed-source, ST-specific adapter.

Most of the standalone SWD-capable debugger boxes are _abusrdly_ priced,
though.  I've had the most success with [SEGGER](https://www.segger.com) tools,
but they want $300+ dollars for their _entry-level_ product.  Keil's ULINK line
runs $400+ even for basic versions.  Olimex and the like offer cheaper
products, but they rely on OpenOCD to do their work, which has the same
complications as the STLINKs.

Some digging turned up the [Black Magic
Probe](https://1bitsquared.com/products/black-magic-probe).  Now, it _also_
does not yet support the STM32G4 family... but I trawled through [their
repository](https://github.com/blacksphere/blackmagic) and adding support looks
[straightforward](https://github.com/blacksphere/blackmagic/wiki/Tips-for-Cortex-M-Target-Implementors).

## Path Forward

I've ordered myself up a Black Magic probe and a P-NUCLEO-IHM03!  Once they
show up we'll be off to the races; until then I'll play around with the
existing Rust embedded infrastructure on one of my other dev boards.

[^1]: Seriously, the STM32G4 line of Nucleo-64 boards are $15 each, which,
      particularly since they decided to deploy an STM32F723 as the on-board
      STLINK, is _less than the value of the chips it carries_ alone.

