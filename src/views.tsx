import { useEffect, useState } from 'react'
import type React from 'react'
import { ArrowLeft, Bookmark, Camera, Check, Compass, LockKeyhole, LogOut, Map as MapIcon, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { CategoryIcon, PlaceRow, categories, fromDatabase, hasValidCoordinates, toDatabase } from './App'
import type { Category, Comment, LocationPhoto, Place, UserPhoto, Viewer } from './App'

export default function ProfileView({ viewer, places: allPlaces, saved, visited, onOpen, onBack, onAdmin, onSignOut, onViewerChange }: { viewer: Viewer; places: Place[]; saved: number[]; visited: number[]; onOpen: (p: Place) => void; onBack: () => void; onAdmin: () => void; onSignOut: () => void; onViewerChange: (viewer: Viewer) => void }) {
  const [tab, setTab] = useState<'visited' | 'saved'>('visited')
  const [settings, setSettings] = useState(false)
  const [name, setName] = useState(viewer.name)
  const [message, setMessage] = useState('')
  const [deleteStep, setDeleteStep] = useState(false)
  const ids = tab === 'visited' ? visited : saved
  const saveName = async (event: React.FormEvent) => {
    event.preventDefault(); if (!name.trim()) return
    if (supabase && !viewer.demo) {
      const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', viewer.id)
      if (error) return setMessage('That name could not be saved.')
    }
    onViewerChange({ ...viewer, name: name.trim() }); setMessage('Display name updated.')
  }
  const deleteAccount = async () => {
    if (!supabase || viewer.demo) return onSignOut()
    const { error } = await supabase.rpc('delete_own_account')
    if (error) return setMessage('Account deletion still needs the final database update.')
    onSignOut()
  }
  return <main className="app account-view">
    <header className="inner-header"><button className="round-button" onClick={onBack} aria-label="Back to map"><ArrowLeft /></button><a className="brand" href="#"><span className="brand-mark"><Compass /></span><span>Wander <em>Éire</em></span></a><button className="round-button" onClick={() => setSettings(!settings)} aria-label="Account settings"><Pencil /></button></header>
    <section className="account-hero"><div className="avatar">{viewer.name.slice(0, 1).toUpperCase()}</div><p className="eyebrow">Your wanderings</p><h1>{viewer.name}</h1><p>{viewer.email}</p><div className="progress"><strong>{new Set(visited.map((id) => allPlaces.find((p) => p.id === id)?.county).filter(Boolean)).size}</strong><span>counties explored<br/>of 32</span></div>{viewer.role === 'admin' && <button className="admin-shortcut" onClick={onAdmin}><LockKeyhole/>Open admin dashboard</button>}</section>
    {settings && <section className="account-settings"><p className="eyebrow">Account settings</p><h2>Make it yours</h2><form onSubmit={saveName}><label>Display name<input value={name} maxLength={60} onChange={(event) => setName(event.target.value)}/></label><button className="primary-button">Save name</button></form>{message && <p role="status">{message}</p>}<div className="account-exit"><button onClick={onSignOut}><LogOut/>Sign out</button>{deleteStep ? <div><p>This removes your profile, saves, visits, comments and pending photos permanently.</p><button onClick={deleteAccount}>Yes, delete my account</button><button onClick={() => setDeleteStep(false)}>Keep my account</button></div> : <button onClick={() => setDeleteStep(true)}><Trash2/>Delete account</button>}</div></section>}
    {!settings && <section className="account-list"><div className="tabs"><button className={tab === 'visited' ? 'active' : ''} onClick={() => setTab('visited')}><Check />Visited <span>{visited.length}</span></button><button className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}><Bookmark />Saved <span>{saved.length}</span></button></div>{ids.length ? ids.map((id) => { const p = allPlaces.find((item) => item.id === id); return p ? <PlaceRow key={id} place={p} onClick={() => onOpen(p)} /> : null }) : <div className="empty"><Compass/><h2>{tab === 'visited' ? 'Your first trail awaits' : 'Nothing tucked away yet'}</h2><p>{tab === 'visited' ? 'Mark a place visited when you’ve made the memory.' : 'Save a place and it’ll be waiting here.'}</p><button className="primary-button" onClick={onBack}>Explore the map</button></div>}</section>}
  </main>
}

export function AdminView({ viewer, places: publicPlaces, onPlacesChange, onBack }: { viewer: Viewer; places: Place[]; onPlacesChange: (places: Place[]) => void; onBack: () => void }) {
  const [items, setItems] = useState<Place[]>(publicPlaces)
  const [comments, setComments] = useState<Comment[]>([])
  const [photoQueue, setPhotoQueue] = useState<UserPhoto[]>([])
  const [officialPhotos, setOfficialPhotos] = useState<LocationPhoto[]>([])
  const [tab, setTab] = useState<'locations' | 'moderation'>('locations')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Place | null>(null)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', county: '', category: 'trail' as Category, latitude: '53.35', longitude: '-7.8', cost: 'Free', distance: '', kicker: '', description: '', address: '', parking: '', facts: '' })

  useEffect(() => {
    if (!supabase || viewer.demo) return
    const client = supabase
    void Promise.all([
      client.from('locations').select('*').order('name'),
      client.from('comments').select('*').eq('status', 'pending').order('created_at'),
      client.from('user_photos').select('*').eq('status', 'pending').order('created_at'),
      client.from('location_photos').select('*').order('position'),
    ]).then(async ([locationsResult, commentsResult, photosResult, officialResult]) => {
      if (locationsResult.data) setItems(locationsResult.data.map((row) => fromDatabase(row)).filter(hasValidCoordinates))
      if (commentsResult.data) setComments(commentsResult.data as Comment[])
      if (photosResult.data) {
        const withUrls = await Promise.all((photosResult.data as UserPhoto[]).map(async (photo) => {
          const { data } = await client.storage.from('location-photos').createSignedUrl(photo.object_path, 3600)
          return { ...photo, url: data?.signedUrl }
        }))
        setPhotoQueue(withUrls)
      }
      if (officialResult.data) {
        const withUrls = await Promise.all((officialResult.data as LocationPhoto[]).map(async (photo) => {
          const { data } = await client.storage.from('location-photos').createSignedUrl(photo.object_path, 3600)
          return { ...photo, url: data?.signedUrl }
        }))
        setOfficialPhotos(withUrls)
      }
      if (locationsResult.error || commentsResult.error || officialResult.error) setNotice('The official gallery needs its Supabase photo update before uploads will work.')
    })
  }, [viewer])

  const publish = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice('')
    const draft: Omit<Place, 'id' | 'archived'> = {
      name: form.name, county: form.county, category: form.category,
      coordinates: [Number(form.longitude), Number(form.latitude)], cost: form.cost,
      distance: form.distance, kicker: form.kicker, description: form.description,
      address: form.address, parking: form.parking,
      facts: form.facts.split(',').map((fact) => fact.trim()).filter(Boolean),
    }
    if (supabase && !viewer.demo) {
      const query = editing
        ? supabase.from('locations').update({ ...toDatabase(draft), updated_at: new Date().toISOString() }).eq('id', editing.id)
        : supabase.from('locations').insert(toDatabase(draft))
      const { data, error } = await query.select().single()
      if (error) { setNotice('That place could not be published. Check the admin database update.'); setBusy(false); return }
      const savedPlace = fromDatabase(data)
      const next = (editing ? items.map((item) => item.id === editing.id ? savedPlace : item) : [...items, savedPlace]).sort((a, b) => a.name.localeCompare(b.name))
      setItems(next); onPlacesChange(next.filter((place) => !place.archived))
    } else {
      const next = editing ? items.map((item) => item.id === editing.id ? { ...draft, id: editing.id, archived: editing.archived } : item) : [...items, { ...draft, id: Date.now(), archived: false }]
      setItems(next); onPlacesChange(next)
    }
    setForm({ name: '', county: '', category: 'trail', latitude: '53.35', longitude: '-7.8', cost: 'Free', distance: '', kicker: '', description: '', address: '', parking: '', facts: '' })
    setAdding(false); setEditing(null); setBusy(false); setNotice(editing ? 'Changes saved to the public guide.' : 'Published — the new place is live on the map.')
  }

  const openEdit = (place: Place) => {
    setForm({ name: place.name, county: place.county, category: place.category, latitude: String(place.coordinates[1]), longitude: String(place.coordinates[0]), cost: place.cost, distance: place.distance, kicker: place.kicker, description: place.description, address: place.address, parking: place.parking, facts: place.facts.join(', ') })
    setAdding(false); setEditing(place); setNotice('')
  }

  const toggleArchive = async (place: Place) => {
    const archived = !place.archived
    if (supabase && !viewer.demo) {
      const { error } = await supabase.from('locations').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', place.id)
      if (error) return setNotice('That change could not be saved. Check the admin database update.')
    }
    const next = items.map((item) => item.id === place.id ? { ...item, archived } : item)
    setItems(next); onPlacesChange(next.filter((item) => !item.archived)); setNotice(archived ? 'Location archived.' : 'Location restored to the public map.')
  }

  const moderate = async (item: Comment, status: 'approved' | 'rejected') => {
    if (supabase && !viewer.demo) {
      const { error } = await supabase.from('comments').update({ status }).eq('id', item.id)
      if (error) return setNotice('That contribution could not be updated.')
    }
    setComments((all) => all.filter((comment) => comment.id !== item.id))
    setNotice(status === 'approved' ? 'Contribution approved and now public.' : 'Contribution rejected.')
  }

  const moderatePhoto = async (item: UserPhoto, status: 'approved' | 'rejected') => {
    if (supabase && !viewer.demo) {
      if (status === 'approved') {
        const { error } = await supabase.from('user_photos').update({ status }).eq('id', item.id)
        if (error) return setNotice('That photo could not be approved.')
      } else {
        const { error } = await supabase.from('user_photos').delete().eq('id', item.id)
        if (error) return setNotice('That photo could not be rejected.')
        const { error: storageError } = await supabase.storage.from('location-photos').remove([item.object_path])
        if (storageError) console.warn('Rejected photo record deleted, but storage cleanup failed.', storageError)
      }
    }
    setPhotoQueue((all) => all.filter((photo) => photo.id !== item.id))
    setNotice(status === 'approved' ? 'Photo approved and now public.' : 'Photo rejected and removed.')
  }

  const uploadOfficialPhoto = async (place: Place, file: File) => {
    const existing = officialPhotos.filter((photo) => photo.location_id === place.id)
    const position = [1, 2, 3].find((slot) => !existing.some((photo) => photo.position === slot))
    if (!position) return setNotice('This location already has its maximum of three photos.')
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) return setNotice('Choose a JPG, PNG, WebP or HEIC image smaller than 8 MB.')
    setPhotoBusy(true); setNotice('')
    if (supabase && !viewer.demo) {
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const objectPath = `official/${place.id}/${crypto.randomUUID()}.${extension}`
      const uploadResult = await supabase.storage.from('location-photos').upload(objectPath, file, { contentType: file.type, upsert: false })
      if (uploadResult.error) { setPhotoBusy(false); setNotice('That image could not be uploaded. Run the official gallery database update first.'); return }
      const { data, error } = await supabase.from('location_photos').insert({ location_id: place.id, object_path: objectPath, position }).select().single()
      if (error) {
        await supabase.storage.from('location-photos').remove([objectPath])
        setPhotoBusy(false); setNotice('That gallery slot could not be saved.'); return
      }
      const signed = await supabase.storage.from('location-photos').createSignedUrl(objectPath, 3600)
      setOfficialPhotos((all) => [...all, { ...(data as LocationPhoto), url: signed.data?.signedUrl }].sort((a, b) => a.position - b.position))
    } else {
      setOfficialPhotos((all) => [...all, { id: Date.now(), location_id: place.id, object_path: URL.createObjectURL(file), position, created_at: new Date().toISOString(), url: URL.createObjectURL(file) }])
    }
    setPhotoBusy(false); setNotice(`Photo ${position} added to ${place.name}.`)
  }

  const removeOfficialPhoto = async (photo: LocationPhoto) => {
    setPhotoBusy(true); setNotice('')
    if (supabase && !viewer.demo) {
      const { error: recordError } = await supabase.from('location_photos').delete().eq('id', photo.id)
      if (recordError) { setPhotoBusy(false); setNotice('That photo could not be removed.'); return }
      const { error: storageError } = await supabase.storage.from('location-photos').remove([photo.object_path])
      if (storageError) console.warn('Official photo record deleted, but storage cleanup failed.', storageError)
    }
    setOfficialPhotos((all) => all.filter((item) => item.id !== photo.id))
    setPhotoBusy(false); setNotice('Photo removed from the gallery.')
  }

  return <main className="admin-view">
    <aside><a className="brand" href="#"><span className="brand-mark"><Compass /></span><span>Wander <em>Éire</em></span></a><nav><button className={tab === 'locations' ? 'active' : ''} onClick={() => setTab('locations')}><MapIcon/>Locations</button><button className={tab === 'moderation' ? 'active' : ''} onClick={() => setTab('moderation')}><MessageCircle/>Moderation {comments.length + photoQueue.length > 0 && <span>{comments.length + photoQueue.length}</span>}</button></nav><div><p>{viewer.name}</p><small>Administrator</small><button onClick={onBack}><ArrowLeft/>Back to public map</button></div></aside>
    <section className="admin-main">
      <header><div><p className="eyebrow">{tab === 'locations' ? 'The field guide' : 'Community care'}</p><h1>{tab === 'locations' ? 'Locations' : 'Moderation'}</h1><p>{tab === 'locations' ? `${items.filter((i) => !i.archived).length} live places across Ireland` : `${comments.length + photoQueue.length} contributions waiting on you`}</p></div>{tab === 'locations' && <button className="primary-button" onClick={() => setAdding(true)}><Plus/>Add location</button>}</header>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {tab === 'locations' && <>
        {(adding || editing) && <form className="admin-form" onSubmit={publish}><div><p className="eyebrow">{editing ? 'Edit place' : 'New place'}</p><h2>{editing ? `Update ${editing.name}` : 'Add to the map'}</h2></div><button type="button" className="modal-close" onClick={() => { setAdding(false); setEditing(null) }} aria-label="Close form"><X/></button>
          <label>Place name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coumshingaun Lough"/></label>
          <label>County<input required value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="e.g. Waterford"/></label>
          <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>{(Object.keys(categories) as Category[]).map((key) => <option key={key} value={key}>{categories[key].label}</option>)}</select></label>
          <label>Latitude<input type="number" step="any" required value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })}/></label>
          <label>Longitude<input type="number" step="any" required value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })}/></label>
          <label>Cost<input required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}/></label>
          <label>Distance / duration<input value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="e.g. 6 km loop"/></label>
          <label className="wide">Short introduction<input value={form.kicker} onChange={(e) => setForm({ ...form, kicker: e.target.value })} placeholder="What makes this place special?"/></label>
          <label className="wide">Quick facts, separated by commas<input value={form.facts} onChange={(e) => setForm({ ...form, facts: e.target.value })} placeholder="e.g. 3–4 hours, Moderate, Dogs on lead"/></label>
          <label className="wide">Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
          <label className="wide">Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/></label>
          <label className="wide">Parking information<input value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })}/></label>
          <section className="admin-photo-editor">
            <div><p className="eyebrow">Official gallery</p><h3>Feature photography</h3><span>{editing ? `${officialPhotos.filter((photo) => photo.location_id === editing.id).length} of 3 photos` : 'Publish the location first, then edit it to add photos.'}</span></div>
            {editing && <div className="admin-photo-slots">{[1, 2, 3].map((position) => {
              const photo = officialPhotos.find((item) => item.location_id === editing.id && item.position === position)
              return photo ? <figure key={position}>{photo.url && <img src={photo.url} alt={`${editing.name} gallery slot ${position}`}/>}<figcaption><span>Photo {position}</span><button type="button" disabled={photoBusy} onClick={() => removeOfficialPhoto(photo)} aria-label={`Remove photo ${position}`}><Trash2/></button></figcaption></figure> : <label className="admin-photo-slot" key={position}><Camera/><strong>Photo {position}</strong><small>JPG, PNG, WebP or HEIC</small><input type="file" disabled={photoBusy} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadOfficialPhoto(editing, file); event.target.value = '' }}/></label>
            })}</div>}
          </section>
          <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish location'}</button>
        </form>}
        <div className="admin-table"><div className="admin-table__head"><span>Location</span><span>Category</span><span>Status</span><span/></div>{items.map((place) => <div className={place.archived ? 'archived' : ''} key={place.id}><span><i style={{ background: categories[place.category].color }}><CategoryIcon category={place.category}/></i><b>{place.name}<small>{place.county}</small></b></span><span>{categories[place.category].label}</span><span>{place.archived ? 'Archived' : 'Live'}</span><span className="row-actions"><button onClick={() => openEdit(place)} aria-label={`Edit ${place.name}`}><Pencil/></button><button onClick={() => toggleArchive(place)} aria-label={`${place.archived ? 'Restore' : 'Archive'} ${place.name}`}><Trash2/></button></span></div>)}</div>
      </>}
      {tab === 'moderation' && <div className="moderation-list">
        {photoQueue.map((item) => <article className="photo-review" key={`photo-${item.id}`}>{item.url && <img src={item.url} alt="Submitted location"/>}<div><p className="eyebrow">Photo · Location #{item.location_id} · {new Date(item.created_at).toLocaleDateString('en-IE')}</p>{item.caption && <blockquote>{item.caption}</blockquote>}<small>Submitted by {item.user_id.slice(0, 8)}…</small></div><div><button onClick={() => moderatePhoto(item, 'approved')}><Check/>Approve</button><button onClick={() => moderatePhoto(item, 'rejected')}><X/>Reject</button></div></article>)}
        {comments.map((item) => <article key={`comment-${item.id}`}><div><p className="eyebrow">Note · Location #{item.location_id} · {new Date(item.created_at).toLocaleDateString('en-IE')}</p><blockquote>{item.body}</blockquote><small>Submitted by {item.user_id.slice(0, 8)}…</small></div><div><button onClick={() => moderate(item, 'approved')}><Check/>Approve</button><button onClick={() => moderate(item, 'rejected')}><X/>Reject</button></div></article>)}
        {!comments.length && !photoQueue.length && <div className="empty"><Check/><h2>Nothing waiting on you.</h2><p>The community queue is clear.</p></div>}
      </div>}
    </section>
  </main>
}

export function ResetPasswordView({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('Those two passwords do not match.')
    if (!supabase) return setError('Supabase is not connected.')
    setBusy(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (updateError) return setError('That link may have expired. Ask for a fresh reset email and try again.')
    setComplete(true)
  }

  return <main className="reset-view"><section>
    <span className="auth-mark"><Compass/></span><p className="eyebrow">A fresh start</p><h1>Choose a new password.</h1>
    {complete ? <><p>Your password is changed. You’re safely signed in again.</p><button className="primary-button" onClick={onDone}>Return to Wander Éire</button></> : <><p>Make it at least 8 characters and something only you know.</p><form onSubmit={updatePassword}><label>New password<input autoFocus type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)}/></label><label>Type it again<input type="password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)}/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button></form></>}
  </section></main>
}

