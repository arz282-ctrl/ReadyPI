# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getUserProfile, listUserKeys, getRecentUsage } from '@readypi/sdk';


// Operation GetUserProfile: 
const { data } = await GetUserProfile(dataConnect);

// Operation ListUserKeys: 
const { data } = await ListUserKeys(dataConnect);

// Operation GetRecentUsage:  For variables, look at type GetRecentUsageVars in ../index.d.ts
const { data } = await GetRecentUsage(dataConnect, getRecentUsageVars);


```