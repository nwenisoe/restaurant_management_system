import React from 'react'
import { get } from '../api/client'

export default function Tables(){
  const [tables, setTables] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() =>{
    let mounted = true
    get('/api/v1/tables').then(data => { if(mounted) setTables(data) }).catch(()=>{}).finally(()=> mounted && setLoading(false))
    return () => mounted = false
  }, [])

  if(loading) return <p>Loading tables...</p>
  return (
    <div className="page tables">
      <h2>Tables</h2>
      <ul>
        {tables.map(t => (
          <li key={t.ID || t.id}>
            Table #{t.Number ?? t.number} — Capacity: {t.Capacity ?? t.capacity}
          </li>
        ))}
      </ul>
    </div>
  )
}
