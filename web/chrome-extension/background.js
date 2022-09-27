// const CLIPDROP_DOMAIN = 'http://localhost:3000'
const CLIPDROP_DOMAIN =
  'https://clipdrop-home-git-chore-stack-structureimage-url-clipdrop.vercel.app'
// const CLIPDROP_DOMAIN = 'https://clipdrop.co'

const PROXY_DOMAIN = 'http://localhost:3001'

function transferToClipDropApp(app, targetUrl) {
  const url = `${CLIPDROP_DOMAIN}/${app}?i=${encodeURIComponent(targetUrl)}`
  chrome.tabs.create({ url })
}

function setContextsMenu() {
  chrome.contextMenus.create({
    id: '@initml/remove-background',
    title: 'Remove Background',
    contexts: ['image'],
  })

  chrome.contextMenus.create({
    id: '@initml/enhance',
    title: 'Image Upscaler',
    contexts: ['image'],
  })

  chrome.contextMenus.create({
    id: '@initml/cleanup',
    title: 'Cleanup',
    contexts: ['image'],
  })

  chrome.contextMenus.create({
    id: '@initml/relight',
    title: 'Relight',
    contexts: ['image'],
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case '@initml/remove-background': {
        const targetUrl = info.srcUrl
        transferToClipDropApp('remove-background', targetUrl)
        break
      }
      case '@initml/enhance': {
        const targetUrl = info.srcUrl
        transferToClipDropApp('image-upscaler', targetUrl)
        break
      }
      case '@initml/cleanup': {
        const targetUrl = info.srcUrl
        transferToClipDropApp('cleanup', targetUrl)
        break
      }
      case '@initml/relight': {
        const targetUrl = info.srcUrl
        transferToClipDropApp('relight', targetUrl)
        break
      }
      default:
        console.warn('Unknown menu item clicked', info)
        break
    }
  })
}

setContextsMenu()
