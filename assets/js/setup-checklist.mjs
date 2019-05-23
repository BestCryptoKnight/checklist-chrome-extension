// @ts-ignore
import { getRandomId } from './utils.mjs'

const root = document.querySelector('.checklist')
let all = localStorage.getItem('all_list')
let today = localStorage.getItem('today_list')

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
  const textareas = Array.from(root.querySelectorAll('textarea'))
  // @ts-ignore
  const buttons = Array.from(root.querySelectorAll('button'))

  console.log(textareas, buttons)
  textareas.forEach(t => addEventListenersToTextarea(t))
}

function addEventListenersToTextarea(textarea) {
  function handleResize(e) {
    const target = e.target
    target.style.height = '0'
    target.style.height =
      target.offsetHeight < target.scrollHeight
        ? target.scrollHeight + 'px'
        : 'calc(var(--font-ml) * 1.4)'
  }

  function handleInput(e) {
    handleResize(e)
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
      handleResize(e)

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
          today.push(item)

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

          root.removeChild(target.parentElement)
        }
      }

      console.log(target, value)
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
  handleResize({ target: textarea })
}

function addNewEditor() {
  const node = getListItemMarkup(null, null, null)
  root.appendChild(node)
  const textarea = node.querySelector('textarea')
  addEventListenersToTextarea(textarea)
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

  console.log('items', items)
  console.log('value', value)
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

  localStorage.setItem(key, JSON.stringify(items))
}
