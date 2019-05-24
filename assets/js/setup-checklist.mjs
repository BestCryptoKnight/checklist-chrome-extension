// @ts-ignore
import { getRandomId } from './utils.mjs'

const root = document.querySelector('.checklist')
let all = localStorage.getItem('all_list')
let today = localStorage.getItem('today_list')

// Array of items with an additional property, isInOriginalPosition
// for us to animate.
let currentItems = []
let isListAnimating = false

export default function setupChecklist() {
  // 1. Setup
  // Get all list items from localStorage.
  // Defaults to empty array if errored.
  try {
    if (all === null) {
      localStorage.setItem('all_list', '[]')
      all = JSON.parse('[]')
    } else {
      all = JSON.parse(all)
    }
    if (today === null) {
      localStorage.setItem('today_list', '[]')
      today = JSON.parse('[]')
    } else {
      today = JSON.parse(today)
    }
  } catch (err) {
    // Reset if errored.
    localStorage.setItem('all_list', '[]')
    localStorage.setItem('today_list', '[]')

    all = JSON.parse('[]')
    today = JSON.parse('[]')
  }

  // 2. Render each item into the dom
  // @ts-ignore
  const markup = today.reduce((acc, curr) => {
    acc.push(getListItemMarkup(curr.id, curr.content, true))
    return acc
  }, [])

  // Shift new editor to end.
  markup.push(getListItemMarkup(null, null, true))
  markup.forEach(m => root.appendChild(m))

  // 3. Add event listeners to each textarea and button
  //   3a. calculate height
  //   3b. onblur or enter take value and update localStorage
  //   3c. toggle visibilty back on

  // @ts-ignore
  const listItems = Array.from(root.querySelectorAll('li'))

  listItems.forEach(i => {
    const [textarea, toggler, dragger] = [
      i.querySelector('textarea'),
      i.querySelector('button.checklist-toggler'),
      i.querySelector('button.drag'),
    ]

    addEventListenersToTextarea(textarea)
    addEventListenersToDragger(dragger)
  })
}

function handleResize(target) {
  target.style.height = '0'
  target.style.height =
    target.offsetHeight < target.scrollHeight
      ? target.scrollHeight + 'px'
      : 'calc(var(--font-ml) * 1.4)'
}

function addEventListenersToTextarea(textarea) {
  function handleInput(e) {
    handleResize(e.target)
  }

  function handleKeyDown(e) {
    if (e.shiftKey && e.key === 'Enter') return
    // If key is enter, trim the value.
    // If value length is > 0, check if textarea has 'data-id'
    // If data-id exists, update localStorage value for 'today' by updating item of that id.
    // If data-id doesn't exist, update localStorage value for 'today' by pushing to array.
    if (e.key === 'Enter') {
      e.preventDefault()
      const [target, value, dataId] = [
        e.target,
        e.target.value.trim(),
        e.target.parentElement.getAttribute('data-id'),
      ]

      // Update current textarea value to trimmed value.
      target.value = value
      handleResize(target)

      if (value.length > 0) {
        if (dataId) {
          // If there's a dataId, we need to update the value in localStorage.
          updateStorage(
            'today_list',
            'UPDATE',
            ListItem({
              id: dataId,
              content: value,
              isComplete: false,
            })
          )
        } else {
          // If there's no dataId, we need to add the value to localStorage.
          const item = ListItem({
            content: value,
            isComplete: false,
          })

          target.parentElement.setAttribute('data-id', item.id)
          // @ts-ignore

          updateStorage('today_list', 'ADD', item)

          // Add new editor to root.
          addNewEditor()
        }
      } else {
        if (dataId) {
          // If there's a dataId, that means it's saved in localStorage.
          // Delete this item from localStorage since it's empty now.
          updateStorage(
            'today_list',
            'DELETE',
            ListItem({
              id: dataId,
            })
          )

          setTimeout(() => {
            if (root.contains(target.parentElement)) {
              root.removeChild(target.parentElement)
            }
          }, 0)
        }
      }
    }
  }

  function handleBlur(e) {
    const [value, parentElement, dataId] = [
      e.target.value.trim(),
      e.target.parentElement,
      e.target.parentElement.getAttribute('data-id'),
    ]

    if (value.length === 0 && dataId) {
      updateStorage(
        'today_list',
        'DELETE',
        ListItem({
          id: dataId,
        })
      )

      root.removeChild(parentElement)
    } else {
      updateStorage(
        'today_list',
        'UPDATE',
        ListItem({
          id: dataId,
          content: value,
          isComplete: false,
        })
      )
    }
  }

  textarea.addEventListener('input', handleInput)
  textarea.addEventListener('keydown', handleKeyDown)
  textarea.addEventListener('blur', handleBlur)
  // Resize on first call.
  handleResize(textarea)
}

function addEventListenersToDragger(dragger) {
  // On mouse down, we'll cache the pointerOffset, so when
  // dragging, we can calculate the dragging from where the
  // mouse was initially clicked.
  const target = {
    current: null,
    rest: null,
  }
  const pointerOffset = {
    x: 0,
    y: 0,
  }

  function handleMouseDown(e) {
    if (!isListAnimating) {
      isListAnimating = true

      const parent = e.target.parentElement
      target.current = parent

      target.current.classList.add('dragging')
      target.current.style.transition = `none`

      // @ts-ignore
      target.rest = Array.from(
        root.querySelectorAll('li[data-id]:not(.dragging)')
      )

      target.rest.forEach(el => {
        el.style.opacity = '.25'
        el.style.transition = 'none'
        el.style.animation = ''
        el.style.pointerEvents = 'none'
        el.style.touchAction = 'none'
      })

      pointerOffset.x = e.clientX
      pointerOffset.y = e.clientY

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('click', endDrag)
    }
  }

  function handleMouseMove(e) {
    const { clientX, clientY } = e

    const translate = {
      x: clientX - pointerOffset.x,
      y: clientY - pointerOffset.y,
    }

    target.current.style.transform = `translate3d(${translate.x}px, ${
      translate.y
    }px, 0px)`
    target.current.style.transition = 'none'
    target.current.style.zIndex = 2

    // requestAnimationFrame to cache new position and translate elements
    // to updated positions.
  }

  function endDrag() {
    // translate to new cached position
    target.current.style.transform = 'translate3d(0px, 0px, 0px)'
    target.current.style.transition = 'transform 250ms var(--ease)'

    target.rest.forEach(el => {
      el.style.opacity = '1'
      el.style.transition = 'none'
      el.style.animation = ''
      el.style.pointerEvents = 'initial'
      el.style.touchAction = 'initial'
    })

    window.removeEventListener('click', endDrag)
    window.removeEventListener('mousemove', handleMouseMove)

    setTimeout(() => {
      target.current.removeAttribute('class')
      target.current.style.zIndex = 'initial'
      target.current.style.transition = `all 250ms var(--ease)`

      isListAnimating = false
    }, 250)
  }

  dragger.addEventListener('mousedown', handleMouseDown)
}

function addNewEditor() {
  const node = getListItemMarkup(null, null, null)
  root.appendChild(node)
  const textarea = node.querySelector('textarea')
  addEventListenersToTextarea(textarea)
  addEventListenersToDragger(node.querySelector('button.drag'))
  textarea.focus()
}

// isInitialMount will add an animation delay.
function getListItemMarkup(id, value, isInitialMount) {
  const li = document.createElement('li')
  li.innerHTML = `
      <button class="checklist-toggler">
        <span>Toggle item</span>
      </button>
      <textarea
        class="checklist-item"
        placeholder="Get shit done!"
        spellcheck="false"
      >${value ? value : ''}</textarea>
      <button class="drag">
        <span>Drag to reorder</span> 
      </button>
  `

  if (id) {
    li.setAttribute('data-id', id)
  }

  if (isInitialMount) {
    li.style.opacity = '0'
    li.style.animation = 'fadeIn 250ms var(--ease)'
    li.style.animationDelay = '1000ms'
    li.style.animationFillMode = 'forwards'
  }

  return li
}

function ListItem({ id = getRandomId(), content = '', isComplete = false }) {
  return {
    id,
    content,
    isComplete,
  }
}

function updateStorage(key, action, value) {
  let items = JSON.parse(localStorage.getItem(key))

  switch (action) {
    case 'DELETE':
      items = items.filter(i => i.id !== value.id)
      break
    case 'UPDATE':
      items = items.map(i => {
        if (i.id === value.id) {
          i = value
        }
        return i
      })
      break
    case 'ADD':
      items.push(value)
      break
  }

  console.log('currentItems', currentItems)

  localStorage.setItem(key, JSON.stringify(items))
}
