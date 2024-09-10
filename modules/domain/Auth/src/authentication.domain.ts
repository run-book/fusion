export type EntraIdAuthentication = {
  method: 'EntraId';
  credentials: {
    tenantId?: string
    clientId: string;            // Public identifier for the app
    clientSecret: string;        // Secret used to authenticate the app and obtain tokens
    resource?: string; // The resource to access. Often not specified
    scope?: string
    version?: 1 | 2

  };
};
export function isEntraIdAuthentication ( auth: Authentication ): auth is EntraIdAuthentication {
  return auth?.method === 'EntraId';
}

export type BasicAuthentication = {
  method: 'Basic';
  credentials: {
    username: string;
    password: string;
  };
};
export const isBasicAuthentication = ( auth: Authentication ): auth is BasicAuthentication => auth?.method === 'Basic';

export type ApiKeyAuthentication = {
  method: 'ApiKey';
  credentials: {
    apiKey: string;
  };
};
export function isApiKeyAuthentication ( auth: Authentication ): auth is ApiKeyAuthentication {
  return auth?.method === 'ApiKey';
}

export type PrivateTokenAuthentication = {
  method: 'PrivateToken';
  credentials: {
    token: string;
  };
};
export function isPrivateTokenAuthentication ( auth: Authentication ): auth is PrivateTokenAuthentication {
  return auth?.method === 'PrivateToken';
}

export type NoAuthentication = {
  method: 'none';
};
export function isNoAuthentication ( auth: Authentication ): auth is NoAuthentication {
  return auth?.method === 'none';
}


// Union export type for general authentication
export type Authentication = EntraIdAuthentication | BasicAuthentication | ApiKeyAuthentication | PrivateTokenAuthentication | NoAuthentication;
export function isAuthentication ( auth: Authentication ): auth is Authentication {
  return isEntraIdAuthentication ( auth ) || isBasicAuthentication ( auth ) || isApiKeyAuthentication ( auth ) || isNoAuthentication ( auth );
}
// Example Usage
