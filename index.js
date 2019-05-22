window.onload = () => init()

function init() {
  setupDate()
  document.body.style.opacity = '1'
}

function setupDate() {
  const el = document.querySelector('.date') 
  const date = new Date().toDateString()
  const [day, year] = [
    date.slice(0, date.length - 4).trim(), 
    date.slice(date.length - 4, date.length)
  ]

  el.querySelector('.day').innerHTML = splitText(day)

  el.querySelector('.year').innerHTML = splitText(year)
}

function splitText(word) {
  if (typeof word === 'string') {
    return word.split('').map((letter, index) => {
      if (letter.trim().length) {
       return `<span class="split-letter"><span style="animation-delay: ${index * 50}ms">${letter}</span></span>`
      }
      return ' '
    }
    ).join('')
  }
  return ''
}
