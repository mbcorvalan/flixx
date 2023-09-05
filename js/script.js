// Constants
const API_URL = 'https://api.themoviedb.org/3/'
const ACCESS_TOKEN =
	'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYjU5ZWYyZjcyMWI4ZTY5ZDU3MjRlNjhlM2FmMmFhYSIsInN1YiI6IjY0ZjBkOWI5ZGJiYjQyMDBlMTYyOTZlYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.yFom0vyJYyHu5EZ9FvLz7c3XzFL9ey0gELpYStTo8sk'
const DEFAULT_LANGUAGE = 'en-US'

// Global state
const globalConfig = {
	currentPage: window.location.pathname,
}

// Show and hide spinner
function toggleSpinner(isVisible) {
	document.querySelector('.spinner').classList.toggle('show', isVisible)
}

// Highlight active navigation link
function highlightActiveNavLink() {
	const navLinks = document.querySelectorAll('.nav-link')
	navLinks.forEach((link) => {
		if (link.getAttribute('href') === globalConfig.currentPage) {
			link.classList.add('active')
		}
	})
}

//Display details
async function displayDetails(apiPath, containerSelector, mediaType) {
	// Fetch the ID from the URL and the data from the API
	const id = new URLSearchParams(window.location.search).get('id')
	const media = await fetchApiData(`${apiPath}/${id}`)

	// Create container div and prepare HTML templates
	const div = document.createElement('div')

	const generalDetails = `
        <div class="details-top">
            <div>
                <img src="${getImageUrl(media)}" class="card-img-top" alt="${
		media.title || media.name
	}">
            </div>
            <div>
                <h2>${media.title || media.name}</h2>
                <p><i class="fas fa-star text-primary"></i> ${media.vote_average.toFixed(
									1
								)} / 10</p>
                <p class="text-muted">Release Date: ${media.release_date}</p>
                <p>${media.overview}</p>
                <h5>Genres</h5>
                <ul class="list-group">
                    ${media.genres
											.map((genre) => `<li>${genre.name}</li>`)
											.join('')}
                </ul>
            </div>
        </div>
    `

	const additionalInfo =
		mediaType === 'movie'
			? `<li><span class="text-secondary">Budget: </span>${addComasToNumber(
					media.budget
			  )}</li>
           <li><span class="text-secondary">Revenue: </span>${addComasToNumber(
							media.revenue
						)}</li>
           <li><span class="text-secondary">Runtime: </span>${
							media.runtime
						} minutes</li>
           <li><span class="text-secondary">Status: </span>${media.status}</li>`
			: `<li><span class="text-secondary">Number of seasons: </span>${media.number_of_seasons}</li>`

	const productionCompanies = `
        <h4>Production Companies</h4>
        <div class="list-group">
            ${media.production_companies
							.map((company) => `<div>${company.name}</div>`)
							.join('')}
        </div>
    `

	// Populate the container div with the prepared HTML
	div.innerHTML = `
        ${generalDetails}
        <div class="details-bottom">
            <h2>Movie Info</h2>
            <ul>
                ${additionalInfo}
            </ul>
            ${productionCompanies}
        </div>
    `

	// Append the container div to the target container
	document.querySelector(containerSelector).appendChild(div)
}

// Fetch data from TMDB API
async function fetchApiData(endpoint) {
	const headers = new Headers({
		Accept: 'application/json',
		Authorization: ACCESS_TOKEN,
	})

	const requestConfig = {
		method: 'GET',
		headers,
	}

	toggleSpinner(true)

	try {
		const response = await fetch(
			`${API_URL}${endpoint}?language=${DEFAULT_LANGUAGE}`,
			requestConfig
		)

		if (!response.ok) {
			throw new Error(`HTTP Error: ${response.status}`)
		}

		return await response.json()
	} catch (error) {
		console.error(`Fetch Error: ${error.message}`)
		throw error
	} finally {
		toggleSpinner(false)
	}
}

// Display popular movies
async function fetchAndDisplayMedia(apiPath, containerSelector, mediaType) {
	try {
		const { results: popularMedia } = await fetchApiData(apiPath)

		if (!popularMedia) return

		const container = document.querySelector(containerSelector)

		popularMedia.forEach((media) => {
			const card = createMediaCard(media, mediaType)
			container.appendChild(card)
		})
	} catch (error) {
		console.error(`Failed to display ${mediaType}: ${error}`)
	}
}

function createMediaCard(media, mediaType) {
	// Create a new 'div' element and set its class to 'card'
	const div = document.createElement('div')
	div.classList.add('card')

	// Determine media details
	const isMovie = mediaType === 'movie'
	const detailsPage = isMovie ? 'movie-details.html' : 'tv-details.html'
	const title = isMovie ? media.title : media.name
	const releaseDate = isMovie ? media.release_date : media.first_air_date

	/* 	// Generate optional anchor tag for movies
	const anchorTag = isMovie ? `<a href="${detailsPage}?id=${media.id}">` : ''
	const anchorCloseTag = isMovie ? '</a>' : '' */

	// Set the inner HTML of the 'div'
	div.innerHTML = `
	<a href="${detailsPage}?id=${media.id}">
		<img src="${getImageUrl(media)}" class="card-img-top" alt="${title}">
	 </a>
	  <div class="card-body">
		<h5 class="card-title">${title}</h5>
		<p class="card-text">
		  <small class="text-muted">Release: ${releaseDate}</small>
		</p>
	  </div>
	`

	return div
}

function getImageUrl(media) {
	const imagePath = media.poster_path
		? `https://image.tmdb.org/t/p/w500/${media.poster_path}`
		: '../images/no-image.jpg'

	return imagePath
}

function addComasToNumber(num) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

async function searchMovie() {
	const searchInput = document.querySelector('#search-term')
	const moviesContainer = document.querySelector('#popular-movies')
	const pagesContainer = document.querySelector('.pagination')
	const prevButton = document.querySelector('#prev-button')
	const nextButton = document.querySelector('#next-button')
	let currentPage = 1
	let results = null

	function loadPage(page) {
		currentPage = page
		const apiPath = `search/movie?query=${encodeURIComponent(
			searchInput.value.trim()
		)}&page=${currentPage}`
		moviesContainer.innerHTML = ''
		fetchApiData(apiPath)
			.then((searchResults) => {
				if (searchResults && searchResults.results) {
					results = searchResults
					searchResults.results.forEach((media) => {
						const card = createMediaCard(media, 'movie')
						moviesContainer.appendChild(card)
					})
				}
			})
			.catch((error) => {
				console.error(`Error: ${error.message}`)
			})
	}

	searchInput.addEventListener('input', async (event) => {
		const searchTerm = event.target.value.trim()
		moviesContainer.innerHTML = ''

		if (searchTerm.length >= 1) {
			console.log(results)
			pagesContainer.classList.add('active')
			loadPage(1)
		} else {
			pagesContainer.classList.remove('active')
			fetchAndDisplayMedia('movie/popular', '#popular-movies', 'movie')
		}

		nextButton.addEventListener('click', () => {
			if (currentPage < results.total_pages) {
				loadPage(currentPage + 1)
				// Enable the prevButton because you're going to the next page.
				prevButton.removeAttribute('disabled')

				// Disable nextButton if you are on the last page.
				if (currentPage + 1 === results.total_pages) {
					nextButton.setAttribute('disabled', 'disabled')
				}
			}
		})

		prevButton.addEventListener('click', () => {
			if (currentPage > 1) {
				loadPage(currentPage - 1)

				// Enable the nextButton because you're going back a page.
				nextButton.removeAttribute('disabled')

				// Disable prevButton if you are on the first page after going back.
				if (currentPage - 1 === 1) {
					prevButton.setAttribute('disabled', 'disabled')
				}
			}
		})
	})
}

// Initialize application
function init() {
	highlightActiveNavLink()

	// Implement specific behavior based on the current page
	switch (globalConfig.currentPage) {
		case '/':
		case '/index.html':
			fetchAndDisplayMedia('movie/popular', '#popular-movies', 'movie')
			searchMovie()
			break
		case '/shows.html':
			fetchAndDisplayMedia('tv/popular', '#popular-shows', 'show')
			break
		case '/movie-details.html':
			displayDetails('movie', '#movie-details', 'movie')
			break
		case '/tv-details.html':
			displayDetails('tv', '#show-details', 'show')
			break
		default:
			console.log('Unknown page')
	}
}

document.addEventListener('DOMContentLoaded', init)
