

### Instructions for Production

For production, everything in this folder is run through Docker. This repository is a submodule of [project-sixth-sense](https://github.com/cs188-software-design-security-w20/project-sixth-sense). Follow the build instructions in the project-sixth-sense [README](https://github.com/cs188-software-design-security-w20/project-sixth-sense/blob/master/README.md) in order to deploy to the [Chefmoji website](http://chefmoji.wtf/). 

### Instructions for Development

For development, you can choose one of two routes: 

If you want to see a fully functional website running on [localhost:8080](http://localhost:8080/), you will still need to go to [project-sixth-sense](https://github.com/cs188-software-design-security-w20/project-sixth-sense). From there, follow the build instructions for development in the [README](https://github.com/cs188-software-design-security-w20/project-sixth-sense/blob/master/README.md). 

If you're simply interested in what the landing page looks like, you can clone this repository into an empty folder on your computer and run from there: 

```
# in an empty folder on your computer
git clone https://github.com/cs188-software-design-security-w20/chefmoji-frontend.git
cd frontend
npm install
npm run dev
```

Note that `npm install` will install the necessary dependencies onto your machine and `npm run dev` will actually run the website on [localhost:8080](http://localhost:8080/) .
