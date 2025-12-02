import React from 'react'
import FeatureCard from './FeatureCard'

export default function CardGrid({items}){
  return (
    <div className="row g-4">
      {items.map(i=> (
        <div className="col-6 col-md-4" key={i.key}>
          <FeatureCard {...i} />
        </div>
      ))}
    </div>
  )
}
