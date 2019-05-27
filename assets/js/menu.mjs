const menuRoot = document.querySelector('div.menu-container')
const menuToggler = document.querySelector('button.menu-toggle')

const state = {
  days: [],
  isMenuOpen: false
}

export default function setupMenu() {
  // Add event listener to menuToggler.
  menuToggler.addEventListener('click', handleToggleMenu)

  // Render the latest 5 days into ul.menu 
  
  const data = localStorage.getItem('all_days')
  try {
    if (data === null) {
      state.days = [] 
      localStorage.setItem('all_days', '[]')
    } else {
      state.days = JSON.parse(data) 
    }
  } catch (err) {
    state.days = []
    localStorage.setItem('all_days', '[]')
  }

  console.log('state', state)

}

function handleToggleMenu(e) {
  if (e) e.stopPropagation()
  if (state.isMenuOpen) {
    state.isMenuOpen = false 
    menuRoot.classList.remove('menu-open')
    window.removeEventListener('mousedown', handleOuterClick)
    window.removeEventListener('keydown', handleKeyDown)
  } else {
    state.isMenuOpen = true
    menuRoot.classList.add('menu-open')
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
