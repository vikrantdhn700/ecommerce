$('body').append('<div class="alert-container"></div>')

function triggerAlert(text, type) {
  const modalType = {
    'success': {
      background: 'linear-gradient(133.63deg, #12EA0E -34.48%, #000000 221.73%)',
      icon: `
        <svg width="24" height="24" viewBox="0 0 560 560" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M428.403 228.161L270.883 388.201C263.043 396.041 252.766 400.002 242.485 400.002C232.364 400.002 222.204 396.163 214.403 388.482L131.926 308.443C116.164 292.923 116.004 267.603 131.563 251.923C147.083 236.122 172.403 236.04 188.083 251.56L242.243 303.521L371.603 171.761C387.283 156.159 412.56 156.038 428.201 171.558C443.881 187.199 443.963 212.48 428.4 228.16L428.403 228.161ZM280 0C125.36 0 0 125.36 0 280C0 434.64 125.36 560 280 560C434.64 560 560 434.64 560 280C560 125.36 434.64 0 280 0Z" fill="white"/>
        </svg>`
    },
    'error': {
      background: 'linear-gradient(133.63deg, #EA0E0E -34.48%, #000000 221.73%)',
      icon: `
        <svg width="24" height="24" viewBox="0 0 532 532" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M266 0C119.28 0 0 119.28 0 266C0 412.72 119.28 532 266 532C412.72 532 532 412.72 532 266C532 119.28 412.72 0 266 0ZM389.2 337.12L337.122 389.198L266.001 318.077L194.88 389.198L142.802 337.12L213.923 265.999L142.802 194.878L194.88 142.8L266.001 213.921L337.122 142.8L389.2 194.878L318.079 265.999L389.2 337.12Z" fill="white"/>
        </svg>`
    },
    undefined: {
      background: 'linear-gradient(133.63deg, #0EB5EA -34.48%, #000000 221.73%)',
      icon: `
        <svg width="24" height="24" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M210 0C325.98 0 420 94.02 420 210C420 325.98 325.98 420 210 420C94.02 420 0 325.98 0 210C0 94.02 94.02 0 210 0ZM210 168C194.535 168 182 180.535 182 196V308C182 323.465 194.535 336 210 336C225.465 336 238 323.465 238 308V196C238 180.535 225.465 168 210 168ZM210 84C194.535 84 182 96.535 182 112C182 127.465 194.535 140 210 140C225.465 140 238 127.465 238 112C238 96.535 225.465 84 210 84Z" fill="white"/>
        </svg>`
    }
  }
  const selectedType = modalType[type]
  const alertBox = `
    <div style="background: ${selectedType.background};" class="modal-alert">
      <div class="content">
        ${selectedType.icon}
        <h6>${text}</h6>
      </div>
      
      <div class="bar"></div>
    </div>`

  $('.alert-container').append(alertBox)
 
  let modal = $('.modal-alert')
  let thisModal = modal[modal.length - 1]

  $(thisModal).fadeIn('ease', () => {
    $(thisModal).children('.bar').addClass('progress')
    const toDelete = thisModal
    setTimeout(() => {
      $(toDelete).fadeOut('slow', () => {
        toDelete.remove()
      })
    }, 5000);
  })

} 



