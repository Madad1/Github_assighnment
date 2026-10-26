import { useEffect, useRef, useState } from 'react'
import './App.css'

const PAGE_SIZE = 12

function UserCard({ user, index }) {
	return (
		<a
			className="user-card"
			style={{ '--card-index': index % PAGE_SIZE }}
			href={user.html_url}
			target="_blank"
			rel="noreferrer"
		>
			<div className="card-topline">
				<span>MEMBER / {String(user.id).padStart(5, '0')}</span>
				<span className="card-arrow">↗</span>
			</div>
			<div className="user-main">
				<img src={user.avatar_url} alt={`${user.login}'s avatar`} loading="lazy" />
				<span className="user-copy">
					<strong>{user.login}</strong>
					<span className="user-type"><i />{user.type || 'GitHub member'}</span>
				</span>
			</div>
			<div className="card-footer">
				<span>VIEW GITHUB PROFILE</span>
				<span className="card-cta">↗</span>
			</div>
		</a>
	)
}

function LoadingCard() {
	return (
		<div className="user-card skeleton-card" aria-hidden="true">
			<div className="skeleton-bar short" />
			<div className="skeleton-person">
				<div className="skeleton-avatar" />
				<div>
					<div className="skeleton-bar" />
					<div className="skeleton-bar short" />
				</div>
			</div>
			<div className="skeleton-bar footer-bar" />
		</div>
	)
}

function App() {
	const [users, setUsers] = useState([])
	const [draft, setDraft] = useState('')
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)
	const [refresh, setRefresh] = useState(0)
	const cursor = useRef(0)
	const [total, setTotal] = useState(null)
	const [hasMore, setHasMore] = useState(true)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const controller = new AbortController()

		async function loadUsers() {
			setLoading(true)
			setError('')
			try {
				const url = query
					? `/api/search?q=${encodeURIComponent(query)}&per_page=${PAGE_SIZE}&page=${page}`
					: `/api/users?per_page=${PAGE_SIZE}&since=${page === 1 ? 0 : cursor.current}`
				const response = await fetch(url, { signal: controller.signal })
				const data = await response.json()
				if (!response.ok) throw new Error(data.message || 'Users could not be loaded.')

				const nextUsers = query ? data.items : data
				if (!query && nextUsers.length) cursor.current = nextUsers.at(-1).id
				setUsers((current) => page === 1 ? nextUsers : [...current, ...nextUsers])
				setTotal(query ? data.total_count : null)
				setHasMore(query ? page * PAGE_SIZE < data.total_count : nextUsers.length === PAGE_SIZE)
			} catch (loadError) {
				if (loadError.name !== 'AbortError') setError(loadError.message || 'Request failed.')
			} finally {
				if (!controller.signal.aborted) setLoading(false)
			}
		}

		loadUsers()
		return () => controller.abort()
	}, [page, query, refresh])

	function submitSearch(event) {
		event.preventDefault()
		setUsers([])
		setPage(1)
		setQuery(draft.trim())
	}

	function clearSearch() {
		setDraft('')
		setUsers([])
		setPage(1)
		setQuery('')
	}

	return (
		<main className="app-shell">
			<header className="topbar">
				<a className="wordmark" href="#top" aria-label="GitHub people home">
					<span className="wordmark-mark">GH</span><span>people<span className="wordmark-dot">.</span></span>
				</a>
				<div className="api-status"><span /> GitHub public API</div>
			</header>

			<section className="intro" id="top">
				<div className="eyebrow"><span className="eyebrow-line" /> THE PEOPLE INDEX <span>01 / 26</span></div>
				<h1>Find your people<span>.</span></h1>
				<p className="intro-copy">A little window into the people building in the open.</p>
				<form className="search-form" onSubmit={submitSearch}>
					<span className="search-glyph" aria-hidden="true">⌕</span>
					<label className="sr-only" htmlFor="user-search">Search GitHub usernames</label>
					<input id="user-search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search a username..." />
					{draft && <button className="clear-search" type="button" onClick={clearSearch} aria-label="Clear search">×</button>}
					<button className="search-button" type="submit">Search <span aria-hidden="true">↗</span></button>
				</form>
				<div className="search-hint"><span>↳</span> Try a name, or browse the latest members</div>
			</section>

			<section className="directory" aria-live="polite">
				<div className="directory-heading">
					<div><p className="section-kicker">THE DIRECTORY</p><h2>{query ? `Results for “${query}”` : 'Recently joined'}</h2></div>
					<div className="result-count"><span className="count-value">{query && total !== null ? total.toLocaleString() : users.length}</span><span>{query ? 'MATCHES' : 'ON THIS PAGE'}</span></div>
				</div>

				{error && <div className="notice error-notice" role="alert"><span>{error}</span><button type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div>}
				{!error && !loading && users.length === 0 && <div className="empty-state"><span className="empty-mark">?</span><h3>No users found</h3><p>Try another username and search again.</p></div>}

				<div className="user-grid">
					{users.map((user, index) => <UserCard key={user.id} user={user} index={index} />)}
					{loading && Array.from({ length: PAGE_SIZE }, (_, index) => <LoadingCard key={index} />)}
				</div>

				{hasMore && users.length > 0 && !loading && <div className="load-more-wrap"><button className="load-more" type="button" onClick={() => setPage((value) => value + 1)}>Load more <span>↓</span></button></div>}
			</section>

			<footer className="page-footer"><span>BUILT WITH THE GITHUB USERS API</span><span>MADE FOR THE OPEN WEB <b>✳</b></span></footer>
		</main>
	)
}

export default App
