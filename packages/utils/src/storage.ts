interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class MemoStorage implements IStorage {
  private storage = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  public setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  public removeItem(key: string): void {
    this.storage.delete(key);
  }

  public clear(): void {
    this.storage.clear();
  }
}

class LocalStorage implements IStorage {
  public static canUse(): boolean {
    const TEST_KEY = generateTestKey();

    // 사용자가 쿠키 차단을 하는 경우 LocalStorage '접근' 시에 예외가 발생
    try {
      localStorage.setItem(TEST_KEY, "test");
      localStorage.removeItem(TEST_KEY);
      return true;
    } catch (_err) {
      return false;
    }
  }

  public getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  public setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  public removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  public clear(): void {
    localStorage.clear();
  }
}

class SessionStorage implements IStorage {
  public static canUse(): boolean {
    const TEST_KEY = generateTestKey();

    // sessionStorage를 사용할 수 없는 경우에 대응
    try {
      sessionStorage.setItem(TEST_KEY, "test");
      sessionStorage.removeItem(TEST_KEY);
      return true;
    } catch (_err) {
      return false;
    }
  }

  public getItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  public setItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  public removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  public clear(): void {
    sessionStorage.clear();
  }
}

const generateTestKey = (): string => {
  return new Array(4)
    .fill(null)
    .map(() => Math.random().toString(36).slice(2))
    .join("");
};

export const generateStorage = (): LocalStorage | MemoStorage => {
  if (LocalStorage.canUse()) {
    return new LocalStorage();
  }
  //local storage를 사용할 수 없는 환경인 경우, inmemory storage를 생성
  return new MemoStorage();
};

export const generateSessionStorage = (): SessionStorage | MemoStorage => {
  if (SessionStorage.canUse()) {
    return new SessionStorage();
  }
  return new MemoStorage();
};

export const safeLocalStorage = generateStorage();

export const safeSessionStorage = generateSessionStorage();

// reference from https://github.com/toss/slash/blob/main/packages/common/storage/src/storage.ts
