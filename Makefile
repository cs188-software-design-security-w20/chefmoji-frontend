CHEFMOJI_SRC_DIR=user-login

install:
	cd $(CHEFMOJI_SRC_DIR) && npm install
	cd $(CHEFMOJI_SRC_DIR) && npm run build
	cp -r $(CHEFMOJI_SRC_DIR)/public/* public/

build:
	cd $(CHEFMOJI_SRC_DIR) && npm run build
	cp -r $(CHEFMOJI_SRC_DIR)/public/* public/

dev:
	cd $(CHEFMOJI_SRC_DIR) && npm run dev
