import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface ApiKey_Key {
  id: UUIDString;
  __typename?: 'ApiKey_Key';
}

export interface Credit_Key {
  id: UUIDString;
  __typename?: 'Credit_Key';
}

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

export interface GetRecentUsageVariables {
  limit?: number | null;
}

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

export interface ListUserKeysData {
  apiKeys: ({
    id: UUIDString;
    keyPrefix: string;
    name?: string | null;
    environment: string;
    lastUsedAt?: TimestampString | null;
  } & ApiKey_Key)[];
}

export interface ModelPricing_Key {
  id: UUIDString;
  __typename?: 'ModelPricing_Key';
}

export interface Referral_Key {
  id: UUIDString;
  __typename?: 'Referral_Key';
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface UsageLog_Key {
  id: UUIDString;
  __typename?: 'UsageLog_Key';
}

export interface UserSubscription_Key {
  id: UUIDString;
  __typename?: 'UserSubscription_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface GetUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserProfileData, undefined>;
  operationName: string;
}
export const getUserProfileRef: GetUserProfileRef;

export function getUserProfile(options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, undefined>;
export function getUserProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserProfileData, undefined>;

interface ListUserKeysRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUserKeysData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUserKeysData, undefined>;
  operationName: string;
}
export const listUserKeysRef: ListUserKeysRef;

export function listUserKeys(options?: ExecuteQueryOptions): QueryPromise<ListUserKeysData, undefined>;
export function listUserKeys(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUserKeysData, undefined>;

interface GetRecentUsageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: GetRecentUsageVariables): QueryRef<GetRecentUsageData, GetRecentUsageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: GetRecentUsageVariables): QueryRef<GetRecentUsageData, GetRecentUsageVariables>;
  operationName: string;
}
export const getRecentUsageRef: GetRecentUsageRef;

export function getRecentUsage(vars?: GetRecentUsageVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentUsageData, GetRecentUsageVariables>;
export function getRecentUsage(dc: DataConnect, vars?: GetRecentUsageVariables, options?: ExecuteQueryOptions): QueryPromise<GetRecentUsageData, GetRecentUsageVariables>;

