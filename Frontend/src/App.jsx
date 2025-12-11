import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:5000'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const [movies, setMovies] = useState([])
  const [loadingMovies, setLoadingMovies] = useState(false)

  // auth form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  // add movie (owner only)
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    releaseYear: '',
    posterUrl: '',
    genres: '', // comma separated
  })

  // review form (per movie id)
  const [reviewForms, setReviewForms] = useState({})

  function handleChange(setter) {
    return (e) => {
      const { name, value } = e.target
      setter((old) => ({ ...old, [name]: value }))
    }
  }

  // load movies on first render and when token changes (not strictly needed)
  useEffect(() => {
    fetchMovies()
  }, [token])

  async function fetchMovies() {
    try {
      setLoadingMovies(true)
      const res = await fetch(`${API_BASE}/api/movies`)
      const data = await res.json()
      setMovies(data)
    } catch (err) {
      console.error(err)
      alert('Failed to load movies')
    } finally {
      setLoadingMovies(false)
    }
  }

  function saveAuth(tokenValue, userValue) {
    setToken(tokenValue)
    setCurrentUser(userValue)
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userValue))
  }

  function handleLogout() {
    setToken('')
    setCurrentUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function handleRegister(e) {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Register failed')
        return
      }
      if (data.accessToken && data.user) {
        saveAuth(data.accessToken, data.user)
        alert('Registered and logged in!')
      }
    } catch (err) {
      console.error(err)
      alert('Register error')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Login failed')
        return
      }
      if (data.accessToken && data.user) {
        saveAuth(data.accessToken, data.user)
        alert('Logged in!')
      }
    } catch (err) {
      console.error(err)
      alert('Login error')
    }
  }

  async function handleCreateMovie(e) {
    e.preventDefault()
    if (!token) {
      alert('You must be logged in as owner')
      return
    }
    const body = {
      title: movieForm.title,
      description: movieForm.description,
      releaseYear: Number(movieForm.releaseYear),
      posterUrl: movieForm.posterUrl,
      genres: movieForm.genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
    }
    try {
      const res = await fetch(`${API_BASE}/api/movies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Could not create movie')
        return
      }
      setMovies((old) => [data, ...old])
      setMovieForm({ title: '', description: '', releaseYear: '', posterUrl: '', genres: '' })
      alert('Movie created')
    } catch (err) {
      console.error(err)
      alert('Create movie error')
    }
  }

  function updateReviewForm(movieId, field, value) {
    setReviewForms((old) => ({
      ...old,
      [movieId]: { ...old[movieId], [field]: value },
    }))
  }

  async function handleAddReview(e, movieId) {
    e.preventDefault()
    if (!token) {
      alert('You must be logged in to review')
      return
    }
    const form = reviewForms[movieId] || { rating: '', text: '' }
    const body = {
      rating: Number(form.rating),
      text: form.text,
    }
    try {
      const res = await fetch(`${API_BASE}/api/${movieId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || 'Could not add review')
        return
      }
      alert('Review added')
      setReviewForms((old) => ({ ...old, [movieId]: { rating: '', text: '' } }))
    } catch (err) {
      console.error(err)
      alert('Add review error')
    }
  }

  return (
    <div>
      <h1>Movie Review System (Very Simple Frontend)</h1>

      {/* AUTH SECTION */}
      <section className="card">
        {currentUser ? (
          <div>
            <p>
              Logged in as <strong>{currentUser.name}</strong> ({currentUser.role})
            </p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
              <h2>Register</h2>
              <div>
                <label>
                  Name:
                  <br />
                  <input
                    name="name"
                    value={registerForm.name}
                    onChange={handleChange(setRegisterForm)}
                  />
                </label>
              </div>
              <div>
                <label>
                  Email:
                  <br />
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleChange(setRegisterForm)}
                  />
                </label>
              </div>
              <div>
                <label>
                  Password:
                  <br />
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleChange(setRegisterForm)}
                  />
                </label>
              </div>
              <div>
                <label>
                  Role:
                  <br />
                  <select
                    name="role"
                    value={registerForm.role}
                    onChange={handleChange(setRegisterForm)}
                  >
                    <option value="user">User</option>
                    <option value="owner">Owner</option>
                  </select>
                </label>
              </div>
              <button type="submit">Register</button>
            </form>

            <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
              <h2>Login</h2>
              <div>
                <label>
                  Email:
                  <br />
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleChange(setLoginForm)}
                  />
                </label>
              </div>
              <div>
                <label>
                  Password:
                  <br />
                  <input
                    type="password"
                    name="password"
                    value={loginForm.password}
                    onChange={handleChange(setLoginForm)}
                  />
                </label>
              </div>
              <button type="submit">Login</button>
            </form>
          </div>
        )}
      </section>

      {/* OWNER: CREATE MOVIE */}
      {currentUser && currentUser.role === 'owner' && (
        <section className="card" style={{ textAlign: 'left' }}>
          <h2>Create Movie (Owner only)</h2>
          <form onSubmit={handleCreateMovie}>
            <div>
              <label>
                Title:
                <br />
                <input
                  name="title"
                  value={movieForm.title}
                  onChange={handleChange(setMovieForm)}
                />
              </label>
            </div>
            <div>
              <label>
                Description:
                <br />
                <textarea
                  name="description"
                  value={movieForm.description}
                  onChange={handleChange(setMovieForm)}
                  rows={3}
                />
              </label>
            </div>
            <div>
              <label>
                Release Year:
                <br />
                <input
                  name="releaseYear"
                  value={movieForm.releaseYear}
                  onChange={handleChange(setMovieForm)}
                />
              </label>
            </div>
            <div>
              <label>
                Poster URL (optional):
                <br />
                <input
                  name="posterUrl"
                  value={movieForm.posterUrl}
                  onChange={handleChange(setMovieForm)}
                />
              </label>
            </div>
            <div>
              <label>
                Genres (comma separated):
                <br />
                <input
                  name="genres"
                  value={movieForm.genres}
                  onChange={handleChange(setMovieForm)}
                />
              </label>
            </div>
            <button type="submit">Save Movie</button>
          </form>
        </section>
      )}

      {/* MOVIE LIST */}
      <section className="card" style={{ textAlign: 'left' }}>
        <h2>Movies</h2>
        <button onClick={fetchMovies} disabled={loadingMovies}>
          {loadingMovies ? 'Loading...' : 'Reload movies'}
        </button>
        {movies.length === 0 && !loadingMovies && <p>No movies yet.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movies.map((movie) => (
            <li
              key={movie._id}
              style={{ border: '1px solid #555', padding: '1rem', marginTop: '1rem' }}
            >
              <h3>{movie.title}</h3>
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  style={{ maxWidth: '150px', display: 'block', marginBottom: '0.5rem' }}
                />
              )}
              <p>{movie.description}</p>
              <p>
                <strong>Year:</strong> {movie.releaseYear}
              </p>
              {Array.isArray(movie.genres) && movie.genres.length > 0 && (
                <p>
                  <strong>Genres:</strong> {movie.genres.join(', ')}
                </p>
              )}

              {currentUser && (
                <form onSubmit={(e) => handleAddReview(e, movie._id)} style={{ marginTop: '1rem' }}>
                  <h4>Add Review</h4>
                  <div>
                    <label>
                      Rating (1-5):
                      <br />
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={(reviewForms[movie._id]?.rating) || ''}
                        onChange={(e) =>
                          updateReviewForm(movie._id, 'rating', e.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <label>
                      Comment:
                      <br />
                      <textarea
                        rows={2}
                        value={reviewForms[movie._id]?.text || ''}
                        onChange={(e) =>
                          updateReviewForm(movie._id, 'text', e.target.value)
                        }
                      />
                    </label>
                  </div>
                  <button type="submit">Submit Review</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default App
