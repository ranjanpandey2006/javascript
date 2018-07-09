import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { createStore, applyMiddleware } from "redux";
import rootReducer from "./reducers";
import {
	directToIntendedDestination,
	shouldBeRedirected, hasCookieParams, setCookieFromParams, authenticate, redirectToAuthUrl, findWPCookie,
} from "./functions/auth";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import createHistory from "history/createBrowserHistory";
import { routerMiddleware } from "react-router-redux";

let history = createHistory();

/**
 * If we are in a development environment, we want the store to include the redux-logger.
 * On a production build we want the logger to be omitted.
 */
let middleware = [
	thunkMiddleware,
	routerMiddleware( history ),
];

if ( process.env.NODE_ENV === "development" ) {
	middleware.push( createLogger() );
}

export const store = createStore(
	rootReducer,
	applyMiddleware( ...middleware )
);

/**
 * Bootstrapping the App, so that we can call it after checking whether users need to be redirected.
 *
 * @returns {void}
 */
function app() {
	addLocaleData( en );

	if ( hasCookieParams() ) {
		setCookieFromParams();
	}

	let wpLoggedIn = findWPCookie();

	authenticate()
		.catch( function() {
			if ( wpLoggedIn ) {
				redirectToAuthUrl();
			}
		} )
		.finally( function() {
			ReactDOM.render(
				<App store={store} history={history}/>,
				document.getElementById( "root" )
			);
		} );
}

if ( shouldBeRedirected() ) {
	directToIntendedDestination();
} else {
	if ( global.Intl ) {
		app();
	} else {
		require.ensure(
			[ "intl", "intl/locale-data/jsonp/en.js" ],
			require => {
				require( "intl" );
				require( "intl/locale-data/jsonp/en.js" );
				app();
			}
		);
	}
}
