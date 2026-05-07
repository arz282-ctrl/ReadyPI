# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `readypi`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUserProfile*](#getuserprofile)
  - [*ListUserKeys*](#listuserkeys)
  - [*GetRecentUsage*](#getrecentusage)
- [**Mutations**](#mutations)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `readypi`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@readypi/sdk` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@readypi/sdk';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@readypi/sdk';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `readypi` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUserProfile
You can execute the `GetUserProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserProfile(options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, undefined>;

interface GetUserProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserProfileData, undefined>;
}
export const getUserProfileRef: GetUserProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, undefined>;

interface GetUserProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetUserProfileData, undefined>;
}
export const getUserProfileRef: GetUserProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserProfileRef:
```typescript
const name = getUserProfileRef.operationName;
console.log(name);
```

### Variables
The `GetUserProfile` query has no variables.
### Return Type
Recall that executing the `GetUserProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserProfileData {
  user?: {
    id: UUIDString;
    email: string;
    fullName?: string | null;
    planTier: string;
    credit_on_user?: {
      balance: Int64String;
    };
  } & User_Key;
}
```
### Using `GetUserProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserProfile } from '@readypi/sdk';


// Call the `getUserProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserProfile(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getUserProfile().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUserProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserProfileRef } from '@readypi/sdk';


// Call the `getUserProfileRef()` function to get a reference to the query.
const ref = getUserProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListUserKeys
You can execute the `ListUserKeys` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUserKeys(options?: ExecuteQueryOptions): QueryPromise<ListUserKeysData, undefined>;

interface ListUserKeysRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUserKeysData, undefined>;
}
export const listUserKeysRef: ListUserKeysRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUserKeys(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUserKeysData, undefined>;

interface ListUserKeysRef {
  ...
  (dc: DataConnect): QueryRef<ListUserKeysData, undefined>;
}
export const listUserKeysRef: ListUserKeysRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUserKeysRef:
```typescript
const name = listUserKeysRef.operationName;
console.log(name);
```

### Variables
The `ListUserKeys` query has no variables.
### Return Type
Recall that executing the `ListUserKeys` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUserKeysData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUserKeysData {
  apiKeys: ({
    id: UUIDString;
    keyPrefix: string;
    name?: string | null;
    environment: string;
    lastUsedAt?: TimestampString | null;
  } & ApiKey_Key)[];
}
```
### Using `ListUserKeys`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUserKeys } from '@readypi/sdk';


// Call the `listUserKeys()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUserKeys();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUserKeys(dataConnect);

console.log(data.apiKeys);

// Or, you can use the `Promise` API.
listUserKeys().then((response) => {
  const data = response.data;
  console.log(data.apiKeys);
});
```

### Using `ListUserKeys`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUserKeysRef } from '@readypi/sdk';


// Call the `listUserKeysRef()` function to get a reference to the query.
const ref = listUserKeysRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUserKeysRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.apiKeys);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.apiKeys);
});
```

## GetRecentUsage
You can execute the `GetRecentUsage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRecentUsage(vars?: GetRecentUsageVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentUsageData, GetRecentUsageVariables>;

interface GetRecentUsageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetRecentUsageVariables): QueryRef<GetRecentUsageData, GetRecentUsageVariables>;
}
export const getRecentUsageRef: GetRecentUsageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRecentUsage(dc: DataConnect, vars?: GetRecentUsageVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentUsageData, GetRecentUsageVariables>;

interface GetRecentUsageRef {
  ...
  (dc: DataConnect, vars?: GetRecentUsageVariables): QueryRef<GetRecentUsageData, GetRecentUsageVariables>;
}
export const getRecentUsageRef: GetRecentUsageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRecentUsageRef:
```typescript
const name = getRecentUsageRef.operationName;
console.log(name);
```

### Variables
The `GetRecentUsage` query has an optional argument of type `GetRecentUsageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRecentUsageVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetRecentUsage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRecentUsageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRecentUsageData {
  usageLogs: ({
    id: UUIDString;
    model: string;
    totalTokens: number;
    creditsUsed: Int64String;
    status: string;
    createdAt: TimestampString;
  } & UsageLog_Key)[];
}
```
### Using `GetRecentUsage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRecentUsage, GetRecentUsageVariables } from '@readypi/sdk';

// The `GetRecentUsage` query has an optional argument of type `GetRecentUsageVariables`:
const getRecentUsageVars: GetRecentUsageVariables = {
  limit: ..., // optional
};

// Call the `getRecentUsage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRecentUsage(getRecentUsageVars);
// Variables can be defined inline as well.
const { data } = await getRecentUsage({ limit: ..., });
// Since all variables are optional for this query, you can omit the `GetRecentUsageVariables` argument.
const { data } = await getRecentUsage();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRecentUsage(dataConnect, getRecentUsageVars);

console.log(data.usageLogs);

// Or, you can use the `Promise` API.
getRecentUsage(getRecentUsageVars).then((response) => {
  const data = response.data;
  console.log(data.usageLogs);
});
```

### Using `GetRecentUsage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRecentUsageRef, GetRecentUsageVariables } from '@readypi/sdk';

// The `GetRecentUsage` query has an optional argument of type `GetRecentUsageVariables`:
const getRecentUsageVars: GetRecentUsageVariables = {
  limit: ..., // optional
};

// Call the `getRecentUsageRef()` function to get a reference to the query.
const ref = getRecentUsageRef(getRecentUsageVars);
// Variables can be defined inline as well.
const ref = getRecentUsageRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `GetRecentUsageVariables` argument.
const ref = getRecentUsageRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRecentUsageRef(dataConnect, getRecentUsageVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.usageLogs);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.usageLogs);
});
```

# Mutations

No mutations were generated for the `readypi` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

