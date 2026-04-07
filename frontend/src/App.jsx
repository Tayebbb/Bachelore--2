import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Router from './routes/router.jsx'

function ScrollRevealInit() {
  const location = useLocation();

  useEffect(() => {
    let observer;
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}

export default function App(){
  return (
    <>
      <ScrollRevealInit />
      <Router />
    </>
  )
}
