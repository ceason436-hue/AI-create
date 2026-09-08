# Third-party notices

## React Bits AnimatedContent

The public-site reveal component at `src/components/animated-content.tsx` is a
dependency-light adaptation of the free React Bits `AnimatedContent` source:

- Source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Animations/AnimatedContent/AnimatedContent.tsx
- License: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
- License model at integration time: MIT + Commons Clause

The implementation preserves the component's viewport-entry intent and prop
shape while replacing GSAP/ScrollTrigger with browser-native
`IntersectionObserver` and the Web Animations API. It adds an explicit
`prefers-reduced-motion` path and leaves server-rendered content visible when
JavaScript is unavailable.
