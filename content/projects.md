+++
title = "Projects"
+++

Listed here are some of the things I've been hacking on in my free time; none
of these are "production grade" projects and most of them were undertaken just
for learning / enjoyment purposes.

### Rust projects

I've been following the [Rust](http://www.rust-lang.org/) programming language
since its early days.  I think there's a lot of things it gets right, and it
feels very much like a modernized C++ to me.  I don't have a ton of projects in
this section _yet_, but I intend to dive deeper into this language in the near
future.

#### [Advent of Code 2018](https://github.com/ajfrantz/advent2018)

My solutions to the 2018 [Advent of Code](https://adventofcode.com).  Rust is
not really a language designed for rapid prototyping, making it a bit of an odd
choice for a speed-oriented contest, however I mostly deployed it here to get
experience writing e.g. graph search algorithms in the language.

#### [Ray Tracing in One Weekend](https://github.com/ajfrantz/in1weekend)

I used the excellent [Ray Tracing in One
Weekend](https://www.amazon.com/dp/B01B5AODD8) mini-book as an excuse to dig
into Rust a bit more.  The book's code is in C++, so I tried to transliterate
it in a style that was still pretty close to the book's sample code, but
improved by what Rust idioms I was familiar with from reading Rust code over
the years.


### C++ projects

I've spent most of my professional career using C++ to build highly-reliable
real-time embedded systems.  Unfortunately, the market for such things being
what it is, I cannot share almost any of that code (and no longer have it in my
possession even if I could).

I mostly try to write things in Rust in my spare time, but that doesn't mean I
don't still dabble here and there.

#### [Practice Buddy Memory Allocator](https://github.com/ajfrantz/buddy-alloc)

While most of the systems I've worked on eschew dynamic memory allocation, it's
an undeniably useful tool.  I've build some "toy" implementations over the
years, but nothing that was built on a solid foundation.  To change things up,
I wanted to try my hand at a ["buddy" memory
allocator](https://en.wikipedia.org/wiki/Buddy_memory_allocation).

The output here is just a few hours of hacking and shouldn't be used for
anything important--I only did the bare minimum of testing to convince myself
that it was working.  That said, I think the insights I gained into how "real"
allocators work was well worth the time invested.

#### [Compile-time FizzBuzz](https://gist.github.com/anonymous/7818f902a374a953b274)

Not really a "project" as much as a thought experiment, I was trolling the
internet one night and got roped into a classic nerd-trap: [optimizing
FizzBuzz](https://news.ycombinator.com/item?id=8832472).  I think it's
worthwhile to occasionally explore even the seemingly "absurd" limits of your
tools, as it helps build insight into how they're best wielded--even when
you're not using them for silly things.


### Other projects

Random extra things done over the years.

#### [Forth Warrior AI](https://github.com/ajfrantz/warrior)

At one point in my career I found myself building tiny microcoded hardware
accelerators and I became mildly fascinated with
[Forth](https://en.wikipedia.org/wiki/Forth_(programming_language)) and its
utility for such tasks.  As part of learning the language I stumbled across
[Forth Warrior](https://github.com/JohnEarnest/Mako/tree/master/games/Warrior2)
and wrote this program to solve it.  Dijkstra's algorithm in Forth!

#### [Naive cross-stitch pattern generator](https://github.com/ajfrantz/flossit)

A friend more-or-less [nerd sniped](https://xkcd.com/356/) me with this project
when his wife took up cross-stitching.  It mostly is just a k-means
implementation that tries to match colors from an image to colors from a thread
library.

Since then I've learned there are all kinds of other tricks that cross-stitch
patterns use to make much better looking products.  Maybe some day I'll revisit
this.

#### [TrueSkill for NCAA Basketball](https://github.com/ajfrantz/bball)

One year I got it into my head that maybe I could beat everyone in my [NCAA
March Madness bracket pool](https://en.wikipedia.org/wiki/March_Madness_pools)
by deploying [TrueSkill](https://en.wikipedia.org/wiki/TrueSkill) to rate teams
and predict outcomes.

It was honestly a one-night effort that wound up not working very well, but it
_was_ a fun way to learn about [Bayesian belief
propagation](https://en.wikipedia.org/wiki/Belief_propagation).


