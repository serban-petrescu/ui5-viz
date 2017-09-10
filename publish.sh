if [ ! -z "$TRAVIS_TAG" ]; then
    git config --global user.email "travis@travis-ci.org"
    git config --global user.name "Travis CI"

    git clone https://github.com/serban-petrescu/packaged-ui5-viz.git

    cp -r dist/* packaged-ui5-viz/
    cp pacakge.json packaged-ui5-viz/pacakge.json
    cd packaged-ui5-viz

    git remote rm origin
    git remote add origin https://serban-petrescu:${GITHUB_TOKEN}@github.com/serban-petrescu/packaged-ui5-viz.git > /dev/null 2>&1

    git add . *.*
    git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
    git tag -a "$TRAVIS_TAG" -m "$TRAVIS_TAG"

    git push --follow-tags --quiet --set-upstream origin master
fi
