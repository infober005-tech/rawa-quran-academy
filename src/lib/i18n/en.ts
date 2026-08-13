import base from "./en/_base";
import dashboards from "./en/dashboards";
import admin from "./en/admin";
import subscription from "./en/subscription";
import features from "./en/features";
import pages from "./en/pages";
import widgets from "./en/widgets";
const dict: Record<string, string> = { ...base, ...dashboards, ...admin, ...subscription, ...features, ...pages, ...widgets };
export default dict;