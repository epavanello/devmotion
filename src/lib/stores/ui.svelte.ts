import { getUser } from '$lib/functions/auth.remote';

class UIStore {
  showLoginPrompt = $state(false);
  loginPromptAction = $state('this action');

  async requireLogin(action: string, fn: () => void) {
    const user = await getUser();
    if (user) {
      fn();
    } else {
      this.loginPromptAction = action;
      this.showLoginPrompt = true;
    }
  }
}

export const uiStore = new UIStore();
