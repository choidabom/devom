import DefaultTheme from 'vitepress/theme'
import './custom.css'
import BilingualContent from '../components/BilingualContent.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BilingualContent', BilingualContent)
  }
}
