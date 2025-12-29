/**
 * @spynejs/cms-adapter
 *
 * Public adapter exports.
 * This file defines the supported CMS adapter implementations.
 */

const SpyneCmsServerWebpackPlugin = require('./internal/cms-adapter-webpack');

module.exports = {
  CmsAdapterWebpack: SpyneCmsServerWebpackPlugin
};
