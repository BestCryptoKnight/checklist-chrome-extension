import { getRandomId } from './utils.mjs'

let allItems, todaysItems

export default function setupChecklist() {
  console.log('setupChecklist')
  let all = localStorage.getItem('all_list')
  let today = localStorage.getItem('today_list')

  // Get all list items from localStorage.
  // Defaults to empty array if errored.
  try {
    if (all === null) {
      localStorage.setItem('all_list', '[]') 
      allItems = JSON.parse('[]')
    } else {
      allItems = JSON.parse(all) 
    }
    if (today === null) {
      localStorage.setItem('today_list', '[]') 
      todaysItems = JSON.parse('[]')
    } else {
      todaysItems = JSON.parse(today) 
    }
  } catch (err) {
    // Reset if errored.
    localStorage.setItem('all_list', '[]')
    localStorage.setItem('today_list', '[]') 
    allItems = []
    todaysItems = []
  }

  // 1. Add event listeners to each textarea
  //   1a. calculate height
  //   1b. onchange take value and debounce update localStorage
  //   1c. toggle visibilty back on
}

function ListItem({
  id,
  content,
  isComplete
} = {
  id: getRandomId(), 
  content: '',
  isComplete: false
}) {
  return {
    id,
    content,
    isComplete
  }
}

