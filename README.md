# line-art
Simple UI to explore the beauty of art

The original goal was to learn the canvas API.

The final product ended up being a way to modulate circles to create pretty designs.

Relax, play around, and find your eye candy.

Hosted at
* https://ericyd.github.io/line-art/harmonograph/
* https://ericyd.github.io/line-art/harmonograph2/
* https://ericyd.github.io/line-art

## Development

```shell
npm ci
npm run watch
# in a new tab
npm run serve
```

## Publishing

This is just hosted through GitHub pages; it's extremely low-tech, so the built assets should be compiled and committed to the repo (sorry, world).

```
npm run build
git add .
git commit -m "built at $(date +date +%Y-%M-%dT%H-%m-%s)"
git push
```
