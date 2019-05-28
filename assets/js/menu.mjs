const menuRoot = document.querySelector('div.menu-container')
const menuToggler = document.querySelector('button.menu-toggle')
const main = document.querySelector('main')

const state = {
  days: [],
  isMenuOpen: false
}

export default function setupMenu() {
  // Add event listener to menuToggler.
  menuToggler.addEventListener('click', handleToggleMenu)

  // Render the latest 5 days into ul.menu 
  renderDayMarkupToDOM(state.days.slice(-5))
  
  try {
    const data = localStorage.getItem('all_days')
    if (data === null) {
      state.days = [] 
      localStorage.setItem('all_days', '[]')
    } else {
      state.days = JSON.parse(data).map(day => ({
        day: new Date(day).toLocaleDateString()
      }))
    }
  } catch (err) {
    state.days = []
    localStorage.setItem('all_days', '[]')
  }
}

function handleToggleMenu(e) {
  if (e) e.stopPropagation()
  if (state.isMenuOpen) {
    state.isMenuOpen = false 
    menuRoot.classList.remove('menu-open')
    main.removeAttribute('class')
    window.removeEventListener('mousedown', handleOuterClick)
    window.removeEventListener('keydown', handleKeyDown)
  } else {
    state.isMenuOpen = true
    menuRoot.classList.add('menu-open')
    main.classList.add('blur')
    window.addEventListener('mousedown', handleOuterClick)
    window.addEventListener('keydown', handleKeyDown)
  }
}

function handleOuterClick(e) {
  if (state.isMenuOpen) {
    const target = e.target
    if (!menuRoot.contains(target) && target !== menuToggler) {
      handleToggleMenu(null) 
    }
  }
}

function handleKeyDown(e) {
  if (e.key === `Escape` && state.isMenuOpen) {
    handleToggleMenu(null)
  }
}

function renderDayMarkupToDOM(items) {
  const menu = menuRoot.querySelector('ul.menu')

  const markup = items.map(i => getItemMarkup(i))

  if (items.length) {
    markup.forEach(m => menu.appendChild(m))
  } else {
    let li = document.createElement('li')
    li.innerHTML = `
      Completed tasks will be listed by day here. 
    `
    menu.appendChild(li)
  }
}

function getItemMarkup(item) {
  const li = document.createElement('li')
  li.setAttribute('class', 'menu-day')

  li.innerHTML = `
    <p>${item.day}</p>  
    <ul>
      ${item.items.map(i => `<li>${i}</li>`)} 
    </ul>
  `

  return li
}

// Updates state.days to reflect checkbox clicks, and updates localStorage
// to reflect the change.
export function updateDaysList(actionType, payload) {
  const now = new Date().toLocaleDateString()

  // Update state.days.
  console.log('actionType', actionType, 'payload', payload, now)
  switch(actionType) {
    case 'ADD': {
      console.log('addd this', payload)
      const currentDay = state.days[state.days.length - 1]

      if (currentDay === undefined) {
        console.log('add day to list') 
      } else if (currentDay.id !== now) {
        console.log('day doesnt exist; add day to list') 
      } else if (currentDay.id === now) {
        console.log('append value to this currentDay.items') 
      }
      break
    }
    default:
      throw new Error(`No actionType of ${actionType} found.`)
  }

  // Update localStorage to reflect state.days
}
