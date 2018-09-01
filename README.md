# Login API
### Features:
- Login using JWT
- Facebook oauth2 support
- Google oauth2 support
- Local login support
- YAML config file
- MongoDB for storing files

### How it works:
1. Request to /auth/facebook
2. You will be redirect to facebook.callbackURL. 
This will decrypt the oauth2 token and exchange it to a JWT token with the recent created username.
3. The user will be stored in mongoDB.
4. The aplication will then redirect to **loginToken.redirectUrl** with the JWT token in the URI.
4. Authentication is enabled. For authenticate, include the JWT token in the header **loginToken.headerName** and use passport with JWT support
```javascript
router.get('/auth', passport.authenticate('jwt'));

```
### How to run:
1. npm install
2. npm start Server.js