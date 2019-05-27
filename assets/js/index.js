import setupChecklist from './checklist.mjs'

window.onload = () => init()

function init() {
  setupDate()
  setupChronograph(localStorage.getItem('end_day'))
  setupChecklist()
  document.body.style.opacity = '1'
}

// Animates current date in.
function setupDate() {
  const el = document.querySelector('.date')
  const date = new Date().toDateString()
  const [day, year] = [
    date.slice(0, date.length - 4).trim(),
    date.slice(date.length - 4, date.length),
  ]

  el.querySelector('.day').innerHTML = splitText(day)

  el.querySelector('.year').innerHTML = splitText(year)
}

function splitText(word) {
  if (typeof word === 'string') {
    return word
      .split('')
      .map((letter, index) => {
        if (letter.trim().length) {
          return `<span class="split-letter"><span style="animation-delay: ${index *
            50}ms">${letter}</span></span>`
        }
        return ' '
      })
      .join('')
  }
  return ''
}

// Given an endDay (value between 1-7 signifies day of week) or undefined,
// returns how much time in ms left from current day until that next end day.
//
// Defaults to 7 (Sunday)
function getDayFrom(endDay = 7) {
  if (endDay < 0 || endDay > 7) {
    console.error(
      `endDay of ${endDay} is not a valid number. Only numbers including 0 - 7 allowed. Defaulting to 7.`
    )
    endDay = 7
  }

  // Will be mutating this value to calculate end.
  const now = new Date()

  if (endDay < now.getDay()) {
    endDay = (endDay % 7) + 7
  }

  const end = new Date(
    new Date(now.setDate(now.getDate() + (endDay - now.getDay() + 1))).setHours(
      0,
      0,
      0,
      0
    )
  )

  console.log('end', end)

  return end
}

function setupChronograph(endDay = 7) {
  const today = new Date()
  // + 1 because day ends technically midnight of THAT day.
  // ex; EOW for Sunday === Monday 12:00AM
  const endOfWeek = getDayFrom(endDay)

  // Set two different intervals so the times don't start matching one another.
  let remainingWeek = Math.abs(endOfWeek - today)
  let weekRemainingEl = document.querySelector('.chronograph #week-remaining')

  setInterval(() => {
    weekRemainingEl.innerText = remainingWeek
    remainingWeek -= 53
  }, 53)

  let remainingDay = Math.abs(getDayFrom(today.getDay()) - today)
  let dayRemainingEl = document.querySelector('.chronograph #today-remaining')

  setInterval(() => {
    dayRemainingEl.innerText = remainingDay
    remainingDay -= 67
  }, 67)
}
