import { useEffect, useRef } from 'react'

export default function useCarouselAutoplay() {
  const trackRef = useRef(null)

  useEffect(() => {
    // No-op hook: keeps compatibility with pages that consume this ref.
  }, [])

  return trackRef
}
