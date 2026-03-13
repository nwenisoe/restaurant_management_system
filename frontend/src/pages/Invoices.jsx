import React from 'react'
import { get } from '../api/client'

export default function Invoices(){
  const [invoices, setInvoices] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() =>{
    let mounted = true
    get('/api/v1/invoices').then(data => { if(mounted) setInvoices(data) }).catch(()=>{}).finally(()=> mounted && setLoading(false))
    return () => mounted = false
  }, [])

  if(loading) return <p>Loading invoices...</p>
  return (
    <div className="page invoices">
      <h2>Invoices</h2>
      <ul>
        {invoices.map(inv => (
          <li key={inv.ID || inv.id}>
            Invoice #{inv.ID ?? inv.id} — Amount: {inv.Total ?? inv.total}
          </li>
        ))}
      </ul>
    </div>
  )
}
