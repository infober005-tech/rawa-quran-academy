import base from "./ar/_base";
import dashboards from "./ar/dashboards";
import admin from "./ar/admin";
import subscription from "./ar/subscription";
import features from "./ar/features";
import pages from "./ar/pages";
const dict: Record<string, string> = { ...base, ...dashboards, ...admin, ...subscription, ...features, ...pages };
export default dict;