var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        StudentTracker: './public/js/lost-kids.js',
        SignIn: './public/js/signin.js',
        GroveCalendar: './public/js/grove-calendar.js',
        GroveOverview: './public/js/grove-overview.js',
        bundle: [
            "./utils/StartTimes.js",
            "./utils/GetCurrentEvent.js",
            "jquery",
            "lodash",
            "moment",
            "bootstrap",
            "select2",
            "jquery-ui",
            "jquery.countdown",
            './public/css-load.js'
        ]
    },
    output: {
        path: './public/build',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['', '.js'],
        modulesDirectories: ['node_modules', 'public/js']
    },
    resolveLoaders: {
        modulesDirectories: ['node_modules', 'public/stylesheets']
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&mimetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            }
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'bundle',
            minChunks: Infinity
        }),
        // new webpack.optimize.UglifyJsPlugin({
        //     mangle: {
        //         except: ['exports', 'require']
        //     }
        // }),
        new webpack.optimize.DedupePlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            'root.jQuery': 'jquery'
        }),
        new ExtractTextPlugin("[name].css")
    ],
    node: {
        fs: "empty" // Need this to prevent webpack errors loading dependancies
    }
};
