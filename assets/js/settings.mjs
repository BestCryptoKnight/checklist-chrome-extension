import { storageIds } from './index.js'
// @ts-ignore
import { renderMenuItemsToDOM } from './menu.mjs'
// @ts-ignore
import { renderChecklistItemsToDOM } from './checklist.mjs'

const root = document.querySelector('div.settings')
const menuRoot = document.querySelector('div.menu-container')

const state = {
  isMenuOpen: false,
  isDarkMode: true,
  isConfirmingReset: false,
}

export default function setupSettings() {
  // 1. Add event listener to toggler.
  const button = root.querySelector('button.header')
  button.addEventListener('click', handleToggleMenu)
  const content = root.querySelector('div.settings-menu')

  function handleToggleMenu(e) {
    if (e) e.stopPropagation()

    state.isMenuOpen = !state.isMenuOpen

    const translateAmt = content.getBoundingClientRect().height
    if (state.isMenuOpen) {
      root.classList.add('settings--open')
      menuRoot.classList.add('submenu--open')
      // @ts-ignore
      root.style.transform = `translateY(${translateAmt * -1}px)`
      window.addEventListener('click', handleOuterClick)
    } else {
      root.classList.remove('settings--open')
      menuRoot.classList.remove('submenu--open')
      root.removeAttribute('style')
      window.removeEventListener('click', handleOuterClick)
    }
  }

  function handleOuterClick(e) {
    const { target } = e

    if (!root.contains(target)) {
      handleToggleMenu(null)
    }
  }

  // 2. Check and setup dark mode and its toggler.
  const localStorageDarkMode = localStorage.getItem(storageIds.darkMode)
  if (
    localStorageDarkMode === null ||
    (localStorageDarkMode !== '0' && localStorageDarkMode !== '1')
  ) {
    localStorage.setItem(storageIds.darkMode, '0')
    state.isDarkMode = false
  } else {
    state.isDarkMode = localStorageDarkMode === '1' ? true : false
  }

  if (!state.isDarkMode) {
    setLight()
  }

  const darkModeBtn = root.querySelector('button.dark-mode')

  darkModeBtn.addEventListener('click', toggleDarkMode)

  function toggleDarkMode() {
    // Set it to the opposite.
    state.isDarkMode = !state.isDarkMode
    localStorage.setItem(storageIds.darkMode, state.isDarkMode ? '1' : '0')

    if (state.isDarkMode) {
      document.documentElement.removeAttribute('style')
    } else {
      setLight()
    }
  }

  // Don't have a setDark because default is dark.
  function setLight() {
    document.documentElement.style.setProperty(
      '--color-black',
      'rgb(18, 21, 25)'
    )
    document.documentElement.style.setProperty(
      '--color-white',
      'rgb(250, 249, 248)'
    )
    document.documentElement.style.setProperty(
      '--color-gray',
      'rgb(238, 238, 238)'
    )
  }

  // 3. Setup reset button.
  const resetBtn = root.querySelector('button.reset')

  resetBtn.addEventListener('click', handleReset)

  function handleReset() {
    if (!state.isConfirmingReset) {
      state.isConfirmingReset = true
      resetBtn.innerHTML = 'Are you sure?'
    } else {
      state.isConfirmingReset = false
      resetBtn.innerHTML = 'Reset'
      localStorage.setItem(storageIds.today, '[]')
      localStorage.setItem(storageIds.all, '[]')
      renderChecklistItemsToDOM([], false)
      renderMenuItemsToDOM(true)
    }
  }
}
