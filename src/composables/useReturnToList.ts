import { useRouter } from 'vue-router'

/**
 * Returns a function that leaves the current page for the ride list.
 *
 * Goes *back* when there's a previous page in this tab (normally the list,
 * so its sort, held in the URL, is preserved). If the page was opened
 * directly, there's nothing to go back to, so it navigates to the list.
 */
export function useReturnToList(): () => void {
  const router = useRouter()

  return function returnToList(): void {
    if (router.options.history.state.back) {
      router.back()
    } else {
      void router.push({ name: 'home' })
    }
  }
}
