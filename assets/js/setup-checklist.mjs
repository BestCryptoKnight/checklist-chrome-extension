// @ts-ignore
import { getRandomId } from './utils.mjs'

export default function setupChecklist() {
  console.log('setupChecklist')
  let all = localStorage.getItem('all_list')
  let today = localStorage.getItem('today_list')

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

  // 3. Add event listeners to each textarea
  //   3a. calculate height
  //   3b. onchange take value and debounce update localStorage
  //   3c. toggle visibilty back on
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

