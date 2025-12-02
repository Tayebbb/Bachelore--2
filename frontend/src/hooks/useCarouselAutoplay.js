import { useEffect, useRef } from 'react'

export default function useCarouselAutoplay({ intervalMs = 3000, mobileThreshold = 768 } = {}){
  const trackRef = useRef(null)

  useEffect(()=>{
    const track = trackRef.current || document.querySelector('.testimonials-static')
    if(!track) return

    let paused = false
    const pause = ()=> paused = true
    const resume = ()=> paused = false

    track.addEventListener('mouseenter', pause)
    track.addEventListener('mouseleave', resume)
    track.addEventListener('focusin', pause)
    track.addEventListener('focusout', resume)

    let cards = track.querySelectorAll('.testimonial-card')
    let gap = parseFloat(getComputedStyle(track).gap) || 16
    let cardWidth = cards[0]?.getBoundingClientRect().width || track.clientWidth
    let isMobileView = track.clientWidth < mobileThreshold
    let visible = isMobileView ? 1 : Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)))
    let maxIndex = Math.max(0, cards.length - visible)

    const recompute = ()=>{
      cards = track.querySelectorAll('.testimonial-card')
      gap = parseFloat(getComputedStyle(track).gap) || 16
      cardWidth = cards[0]?.getBoundingClientRect().width || track.clientWidth
      isMobileView = track.clientWidth < mobileThreshold
      visible = isMobileView ? 1 : Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)))
      maxIndex = Math.max(0, cards.length - visible)
    }

    let idx = 0
    const scrollToIndex = (i, smooth = true)=>{
      const left = Math.round(i * (cardWidth + gap))
      try{ track.scrollTo({left, behavior: smooth ? 'smooth' : 'auto'}) }catch(e){ track.scrollLeft = left }
    }

    scrollToIndex(0, false)

    const step = ()=>{
      if(paused) return
      recompute()
      idx++
      if(idx > maxIndex) idx = 0
      scrollToIndex(idx, true)
    }

    const interval = setInterval(step, intervalMs)

    let resizeTimer = null
    const onResize = ()=>{
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(()=>{
        recompute()
        if(idx > maxIndex) idx = 0
        scrollToIndex(idx, true)
      }, 120)
    }
    window.addEventListener('resize', onResize)

    return ()=>{
      clearInterval(interval)
      window.removeEventListener('resize', onResize)
      track.removeEventListener('mouseenter', pause)
      track.removeEventListener('mouseleave', resume)
      track.removeEventListener('focusin', pause)
      track.removeEventListener('focusout', resume)
    }
  }, [intervalMs, mobileThreshold])

  return trackRef
}
