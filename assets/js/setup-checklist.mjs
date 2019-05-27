// @ts-ignore
import { getRandomId } from './utils.mjs'

const TRANSITION_DURATION = 250

// Cache root <ul> element.
const root = document.querySelector('.checklist')

let storageIds = {
  all: 'all_list',
  today: 'today_list',
}

const state = {
  listItems: [],
  isListAnimating: false,
  // When an element gets clicked and dragged, we'll cache its original position.
  // This will let us know how much to translate each element that it intersects.
  currentDraggedElementCachedPosition: null,
  // Each time an element is intersected, we'll cache its position, so if the user
  // drops the target, it'll translate to the cached position.
  // currentOpenIndexCachedPosition: null,
  currentDraggingIndex: null,
}

export default function setupChecklist() {
  // 1. Setup
  // Get all list items from localStorage.
  // Defaults to empty array if errored.
  let all = localStorage.getItem(storageIds.all)
  let today = localStorage.getItem(storageIds.today)
  try {
    if (all === null) {
      localStorage.setItem(storageIds.all, '[]')
      all = JSON.parse('[]')
    } else {
      all = JSON.parse('[]')
    }
    if (today === null) {
      localStorage.setItem(storageIds.today, '[]')
      // @ts-ignore
      today = []
    } else {
      today = JSON.parse(today)
    }
  } catch (err) {
    // Reset if errored.
    localStorage.setItem(storageIds.all, '[]')
    localStorage.setItem(storageIds.today, '[]')

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

  // Map today values to have a property, isInOriginalPosition, which
  // will let us know how to translate the element.
  // @ts-ignore
  state.listItems = today.map(t => ({
    item: t,
    isInOriginalPosition: true,
    el: root.querySelector(`[data-id="${t.id}"]`),
  }))

  // 3. Add event listeners to each textarea and button
  //   3a. calculate height
  //   3b. onblur or enter take value and update localStorage
  //   3c. toggle visibilty back on

  // @ts-ignore
  Array.from(root.querySelectorAll('li')).forEach(i => {
    const [textarea, toggler, dragger] = [
      i.querySelector('textarea'),
      i.querySelector('button.checklist-toggler'),
      i.querySelector('button.drag'),
    ]

    addEventListenersToTextarea(textarea)
    addEventListenersToDragger(dragger)
  })

  // Add an event listener to resize textareas on resize.
  window.addEventListener('resize', () => {
    // @ts-ignore
    const textareas = Array.from(root.querySelectorAll('textarea'))
    textareas.forEach(t => handleResize(t))
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
            storageIds.today,
            'UPDATE',
            ListItem({
              id: dataId,
              content: value,
            })
          )
        } else {
          // If there's no dataId, we need to add the value to localStorage.
          const item = ListItem({
            content: value,
          })

          target.parentElement.setAttribute('data-id', item.id)
          // @ts-ignore

          updateStorage(storageIds.today, 'ADD', item)

          // Add new editor to root.
          addNewEditor()
        }
      } else {
        if (dataId) {
          // If there's a dataId, that means it's saved in localStorage.
          // Delete this item from localStorage since it's empty now.
          updateStorage(
            storageIds.today,
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
        storageIds.today,
        'DELETE',
        ListItem({
          id: dataId,
        })
      )

      root.removeChild(parentElement)
    } else {
      updateStorage(
        storageIds.today,
        'UPDATE',
        ListItem({
          id: dataId,
          content: value,
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
  const target = {
    current: null,
    rest: null,
  }
  // On mouse down, we'll cache the pointerOffset, so when
  // dragging, we can calculate the dragging from where the
  // mouse was initially clicked.
  const pointerOffset = {
    x: 0,
    y: 0,
  }

  function handleMouseDown(e) {
    if (!state.isListAnimating) {
      state.isListAnimating = true

      const parent = e.target.parentElement
      target.current = parent

      // @ts-ignore
      state.currentDraggingIndex = state.listItems.findIndex(
        i => i.item.id === parent.getAttribute('data-id')
      )

      const draggedElPosition = parent.getBoundingClientRect()
      state.currentDraggedElementCachedPosition = {
        height: draggedElPosition.height,
        top: draggedElPosition.height + window.pageYOffset,
        y: draggedElPosition.height + window.pageYOffset,
      }

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

    // requestAnimationFrame to cache new position and translate elements
    // to updated positions.
    calculateIntersection()
  }

  let intersectionAnimationId = null
  // Flag to check if calculating intersection if rAF loops back before
  // our calculations are finished.
  let isTransitioningIntersection = false
  function calculateIntersection() {
    if (!isTransitioningIntersection) {
      target.rest.forEach(el => {
        // Check if current dragged item is intersecting the center of target.
        const {
          top: oTop,
          bottom: oBottom,
          left: oLeft,
          right: oRight,
          height: oHeight,
          width: oWidth,
        } = el.getBoundingClientRect()

        const {
          top,
          bottom,
          left,
          right,
        } = target.current.getBoundingClientRect()

        const halfHeight = oHeight / 2

        if (
          top <= oBottom - halfHeight &&
          bottom >= oTop + halfHeight &&
          left <= oRight - oWidth / 2 &&
          right >= oLeft + oWidth / 2
        ) {
          isTransitioningIntersection = true
          const dataId = el.getAttribute('data-id')

          // 1. Get the index of the intersecting element.
          // @ts-ignore
          const indexIntersected = state.listItems.findIndex(
            i => i.item.id === dataId
          )
          // 2. Calculate which elements need to move.
          const listItemsToMove =
            indexIntersected > state.currentDraggingIndex
              ? state.listItems.slice(
                  state.currentDraggingIndex + 1,
                  indexIntersected + 1
                )
              : state.listItems.slice(
                  indexIntersected,
                  state.currentDraggingIndex
                )

          // 3. Before moving, cache the position of the intersected element.
          const itemIntersected = state.listItems[indexIntersected]

          console.log('itemIntersected', itemIntersected)

          const translate = {
            x: 0,
            y: 0,
          }

          translate.y =
            indexIntersected > state.currentDraggingIndex
              ? state.currentDraggedElementCachedPosition.height * -1
              : state.currentDraggedElementCachedPosition.height

          listItemsToMove.forEach(item => {
            if (item.isInOriginalPosition) {
              item.isInOriginalPosition = false
              item.el.style.transform = `translate3d(0px, ${
                translate.y
              }px, 0px)`
              item.el.style.transition = `transform ${TRANSITION_DURATION /
                2}ms var(--ease)`
            } else {
              item.isInOriginalPosition = true
              item.el.style.transform = `translate3d(0px, 0px, 0px)`
            }
          })

          setTimeout(() => {
            // Update list to reflect change
            let copy = state.listItems.slice()
            copy.splice(state.currentDraggingIndex, 1)

            let start = copy.slice(0, indexIntersected)
            let end = copy.slice(indexIntersected)

            let final = [
              ...start,
              state.listItems[state.currentDraggingIndex],
              ...end,
            ]

            state.listItems = final

            state.currentDraggingIndex = indexIntersected

            isTransitioningIntersection = false
          }, TRANSITION_DURATION / 2)
        }
      })
    }

    intersectionAnimationId = requestAnimationFrame(calculateIntersection)
  }

  // Handles:
  // 1. Moving the dragged item around
  // 2. Scrolling window up/down based on the position on the dragged item.
  let isScrolling = false
  let scrollAnimationId = null
  let translateOffsetAmount = 0
  function handleMouseMove(e) {
    const translate = {
      x: e.clientX - pointerOffset.x,
      y: e.clientY - pointerOffset.y,
    }

    if (!isScrolling) {
      target.current.style.transform = `translate3d(${
        translate.x
      }px, ${translate.y + translateOffsetAmount}px, 0px)`
    }
    target.current.style.transition = 'none'
    target.current.style.zIndex = 2

    // Scroll window up/down based on position of dragged item.
    const shouldScrollUp = e.clientY < 100
    const shouldScrollDown = e.clientY > innerHeight - 100

    const isAtTopOfPage = () => window.pageYOffset <= 0
    const isAtBottomOfPage = () =>
      window.innerHeight + window.scrollY >= document.body.offsetHeight

    console.log('isAtBottomOfPage', isAtBottomOfPage)

    if (shouldScrollUp && !isAtTopOfPage()) {
      scroll(-1)
    }
    if (shouldScrollDown && !isAtBottomOfPage()) {
      scroll(1)
    }
    if (isScrolling && !shouldScrollUp && !shouldScrollDown) {
      stopScroll()
    }

    function scroll(direction) {
      isScrolling = true

      cancelAnimationFrame(scrollAnimationId)

      // If we hit the top or bottom of the page, stop scrolling.
      if (
        (window.pageYOffset <= 0 && direction === -1) ||
        (window.innerHeight + window.scrollY >= document.body.offsetHeight &&
          direction === 1)
      ) {
        stopScroll()
        return
      }

      translateOffsetAmount += direction * 10

      window.scrollTo({
        top: window.pageYOffset + direction * 10,
      })

      target.current.style.transform = `translate3d(${
        translate.x
      }px, ${translate.y + translateOffsetAmount}px, 0px)`

      scrollAnimationId = requestAnimationFrame(() => scroll(direction))
    }

    function stopScroll() {
      isScrolling = false
      cancelAnimationFrame(scrollAnimationId)
    }
  }

  function endDrag() {
    // Translate dragged item to new cached position.
    console.log('endDrag state', state)

    target.current.style.transform = `translate3d(0px, 0px, 0px)`
    target.current.style.transition = `transform ${TRANSITION_DURATION}ms var(--ease)`

    target.rest.forEach(el => {
      el.style.opacity = '1'
      el.style.transition = 'none'
      el.style.animation = ''
      el.style.pointerEvents = 'initial'
      el.style.touchAction = 'initial'
    })

    window.removeEventListener('click', endDrag)
    window.removeEventListener('mousemove', handleMouseMove)
    // Cleanup - clear rAF animations
    // Set translateOffset back to 0 since scroll is over.
    cancelAnimationFrame(scrollAnimationId)
    translateOffsetAmount = 0
    cancelAnimationFrame(intersectionAnimationId)
    state.currentDraggedElementCachedPosition = null

    setTimeout(() => {
      target.current.removeAttribute('class')
      target.current.style.zIndex = 'initial'
      target.current.style.transition = `all ${TRANSITION_DURATION}ms var(--ease)`

      state.isListAnimating = false

      // render updated list into DOM
    }, TRANSITION_DURATION)
  }

  dragger.addEventListener('mousedown', handleMouseDown)
}

function addNewEditor() {
  const node = getListItemMarkup(null, null, null)
  root.appendChild(node)

  const textarea = node.querySelector('textarea')
  const dragButton = node.querySelector('button.drag')

  addEventListenersToTextarea(textarea)
  addEventListenersToDragger(dragButton)
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

function ListItem({ id = getRandomId(), content = '' }) {
  return {
    id,
    content,
  }
}

function updateStorage(key, action, value) {
  let items = JSON.parse(localStorage.getItem(key))
  let shouldUpdate = true

  switch (action) {
    case 'DELETE':
      items = items.filter(i => i.id !== value.id)
      break
    case 'UPDATE':
      items = items.map(i => {
        if (value.id === null) {
          shouldUpdate = false
        }
        if (i.id === value.id) {
          // If content is the same, no need to update.
          if (i.content === value.content || i.content.length === 0) {
            shouldUpdate = false
          }
          i = value
        }
        return i
      })
      break
    case 'ADD':
      items.push(value)
      break
  }

  if (shouldUpdate) {
    state.listItems = items.map(i => ({
      item: i,
      isInOriginalPosition: true,
      el: root.querySelector(`[data-id="${i.id}"]`),
    }))

    localStorage.setItem(key, JSON.stringify(items))
  }
}
