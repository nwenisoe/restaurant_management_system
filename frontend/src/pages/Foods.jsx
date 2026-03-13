import React from 'react'
import { get } from '../api/client'

export default function Foods(){
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() =>{
    let mounted = true
    get('/api/v1/foods').then(data => { if(mounted) setItems(data) }).catch(()=>{}).finally(()=> mounted && setLoading(false))
    return () => mounted = false
  }, [])

  if(loading) return <p>Loading foods...</p>
  return (
    <div className="page foods">
      <h2>Foods</h2>
      <ul>
        {items.map(it => (
          <li key={it.ID || it.id}>
            <strong>{it.Name || it.name}</strong> — {it.Price ?? it.price}
          </li>
        ))}
      </ul>
    </div>
  )
}
