import { getUser } from '$lib/functions/auth.remote';

class UIStore {
  showLoginPrompt = $state(false);
  loginPromptAction = $state('this action');

  async requireLogin(action: string, fn: () => void | Promise<void>) {
    const user = await getUser();
    if (user) {
      await fn();
    } else {
      this.loginPromptAction = action;
      this.showLoginPrompt = true;
    }
  }
}

export const uiStore = new UIStore();
