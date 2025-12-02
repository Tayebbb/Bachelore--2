import React, { useState } from 'react'

export default function Bills(){
  const [total, setTotal] = useState('')
  const [people, setPeople] = useState(2)
  const [tip, setTip] = useState(0)
  const [tax, setTax] = useState(0)
  const [segments, setSegments] = useState([])
  const [segName, setSegName] = useState('')
  const [segAmount, setSegAmount] = useState('')
  const [segError, setSegError] = useState('')

  const addSegment = ()=>{
    setSegError('')
    const name = (segName || '').trim()
    const amt = parseFloat(segAmount)
    if(!name){ setSegError('Please enter a segment name'); return }
    if(isNaN(amt)){ setSegError('Please enter a valid amount'); return }
    setSegments(s=>[...s, {id: Date.now(), name, amount: amt}])
    setSegName('')
    setSegAmount('')
  }

  const segmentsTotal = segments.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0)
  const totalNum = segments.length ? segmentsTotal : (parseFloat(total) || 0)
  const taxAmt = totalNum * (parseFloat(tax) || 0) / 100
  const tipAmt = totalNum * (parseFloat(tip) || 0) / 100
  const grand = totalNum + taxAmt + tipAmt
  const per = people > 0 ? (grand / people) : grand

  return (
    <main className="container py-5 bills-page">
      <div className="row">
        <div className="col-lg-8">
          <div className="auth-card p-4">
            <h3>Bills — Calculator & Splitter</h3>
            <p className="muted">Enter bill details and split the amount between people.</p>

            <form>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Total amount</label>
                  <input className="form-control form-control-lg" inputMode="decimal" value={total} onChange={e=>setTotal(e.target.value)} placeholder="e.g. 1200" />
                  <div className="form-text mt-1">Or add segments below — when segments exist their sum will be used as total.</div>
                </div>
              </div>

              {/* Segments section */}
              <div className="mt-4">
                <h6 className="mb-2">Segments</h6>
                <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-7">
                      <input className="form-control" placeholder="e.g. Groceries" value={segName} onChange={e=>setSegName(e.target.value)} />
                    </div>
                    <div className="col-8 col-md-3">
                      <input className="form-control" placeholder="Amount" value={segAmount} onChange={e=>setSegAmount(e.target.value)} inputMode="decimal"
                        onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addSegment() } }} />
                    </div>
                    <div className="col-4 col-md-2 d-grid">
                      <button type="button" className="btn btn-outline-primary" onClick={addSegment} disabled={!segName.trim() || isNaN(parseFloat(segAmount))}>+</button>
                    </div>
                  </div>
                  {segError && <div className="text-danger small mt-2">{segError}</div>}

                <div className="mt-3">
                  {segments.length === 0 && <div className="muted small">No segments added.</div>}
                  {segments.map(seg=> (
                    <div key={seg.id} className="d-flex align-items-center gap-2 mb-2 segment-item">
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{seg.name}</div>
                        <div className="muted small">{seg.amount.toFixed(2)} Tk</div>
                      </div>
                      <div className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={()=> setSegments(s=>s.filter(x=>x.id!==seg.id))}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* People selection after segments */}
                <div className="mt-4">
                  <label className="form-label">People</label>
                  <input className="form-control" type="number" min={1} value={people} onChange={e=>setPeople(parseInt(e.target.value||1))} />
                </div>
              </div>
            </form>

            <div className="row mt-4">
              <div className="col-12 col-md-7">
                <div className="muted">Tax: <span className="fw-bold">{taxAmt.toFixed(2)} Tk</span></div>
                <div className="muted">Tip: <span className="fw-bold">{tipAmt.toFixed(2)} Tk</span></div>
              </div>
              <div className="col-12 col-md-5 text-md-end mt-3 mt-md-0">
                <div className="grand">Grand total: <span className="fw-bold">{grand.toFixed(2)} Tk</span></div>
                <div className="per">Per person: <span className="fw-bold">{isNaN(per) ? '—' : per.toFixed(2)} Tk</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="gradient-card p-4">
            <h6>Quick tips</h6>
            <ul className="muted small mb-0">
              <li>Add named segments (e.g. Groceries) using the name + amount fields and press the <strong>+</strong> button (or press Enter) to add them.</li>
              <li>When segments exist their sum will be used as the total for calculations.</li>
              <li>Use the Remove button on a segment to delete it; the total will update automatically.</li>
              <li>After adding segments, choose the number of <strong>People</strong> below to split the final amount.</li>
              <li>Round the per-person amount when collecting cash.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
