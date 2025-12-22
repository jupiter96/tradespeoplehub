
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    base: '/',
    plugins: [react()],
    esbuild: {
      drop: ['console', 'debugger'],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/fd9129499c9c9a681a5a7faf0843ea90742e29c4.png': path.resolve(__dirname, './src/assets/fd9129499c9c9a681a5a7faf0843ea90742e29c4.png'),
        'figma:asset/f7d2d5e8e4c1a88d1b083f490138959c69f83611.png': path.resolve(__dirname, './src/assets/f7d2d5e8e4c1a88d1b083f490138959c69f83611.png'),
        'figma:asset/f1d010159c6cb7c35142621cdde2a80e22049b68.png': path.resolve(__dirname, './src/assets/f1d010159c6cb7c35142621cdde2a80e22049b68.png'),
        'figma:asset/e893decd679ab5c378e9b19f9b9ae7d35588e164.png': path.resolve(__dirname, './src/assets/e893decd679ab5c378e9b19f9b9ae7d35588e164.png'),
        'figma:asset/e7c88619f3afccee7ec2a322316aa19c8536ed04.png': path.resolve(__dirname, './src/assets/e7c88619f3afccee7ec2a322316aa19c8536ed04.png'),
        'figma:asset/e1c037263ad447fb88ea0f991b3910b9cdd26dec.png': path.resolve(__dirname, './src/assets/e1c037263ad447fb88ea0f991b3910b9cdd26dec.png'),
        'figma:asset/e0cd63eca847c922f306abffb67a5c6de3fd7001.png': path.resolve(__dirname, './src/assets/e0cd63eca847c922f306abffb67a5c6de3fd7001.png'),
        'figma:asset/dd6fe2ef1a03984d604a84733ad3fc028f219515.png': path.resolve(__dirname, './src/assets/dd6fe2ef1a03984d604a84733ad3fc028f219515.png'),
        'figma:asset/dd6b7ad36bfc9ef5f2da8fc39b0baee836560c6c.png': path.resolve(__dirname, './src/assets/dd6b7ad36bfc9ef5f2da8fc39b0baee836560c6c.png'),
        'figma:asset/d9a98abc9580028a3a705de6265792ca99657c3c.png': path.resolve(__dirname, './src/assets/d9a98abc9580028a3a705de6265792ca99657c3c.png'),
        'figma:asset/d3ef20f75187a58dc84d379242cc00930b0fe7dd.png': path.resolve(__dirname, './src/assets/d3ef20f75187a58dc84d379242cc00930b0fe7dd.png'),
        'figma:asset/d040e49e61f672a1133d6a29ffba1afdc3a08f8b.png': path.resolve(__dirname, './src/assets/d040e49e61f672a1133d6a29ffba1afdc3a08f8b.png'),
        'figma:asset/c313d07ef25a44718fc787493850afb4fd972533.png': path.resolve(__dirname, './src/assets/c313d07ef25a44718fc787493850afb4fd972533.png'),
        'figma:asset/c1e5f236e69ba84c123ce1336bb460f448af2762.png': path.resolve(__dirname, './src/assets/c1e5f236e69ba84c123ce1336bb460f448af2762.png'),
        'figma:asset/bfc01ea5c03a091e73d461f3681a71e684945f27.png': path.resolve(__dirname, './src/assets/bfc01ea5c03a091e73d461f3681a71e684945f27.png'),
        'figma:asset/abf7759026040812d1be0192ad93cae51d649fa4.png': path.resolve(__dirname, './src/assets/abf7759026040812d1be0192ad93cae51d649fa4.png'),
        'figma:asset/aa5c744503b85acab051f49dd766555a7ab2fa90.png': path.resolve(__dirname, './src/assets/aa5c744503b85acab051f49dd766555a7ab2fa90.png'),
        'figma:asset/a300990eec525f09f7ce33541380441ca39f485c.png': path.resolve(__dirname, './src/assets/a300990eec525f09f7ce33541380441ca39f485c.png'),
        'figma:asset/a0de430b25f40690ee801be2a6d5041990689f12.png': path.resolve(__dirname, './src/assets/a0de430b25f40690ee801be2a6d5041990689f12.png'),
        'figma:asset/a0d52e41421368b587d5d25694189717343e2473.png': path.resolve(__dirname, './src/assets/a0d52e41421368b587d5d25694189717343e2473.png'),
        'figma:asset/9e2ad0c0ba99302026a62ba196c4effa34124b21.png': path.resolve(__dirname, './src/assets/9e2ad0c0ba99302026a62ba196c4effa34124b21.png'),
        'figma:asset/9e1fa7019bb76742ab74f35d79e90baab00a59e9.png': path.resolve(__dirname, './src/assets/9e1fa7019bb76742ab74f35d79e90baab00a59e9.png'),
        'figma:asset/9b61b5d0d7f96707aca154f4962f012df96de602.png': path.resolve(__dirname, './src/assets/9b61b5d0d7f96707aca154f4962f012df96de602.png'),
        'figma:asset/9ad96818ef3777dbb7fdf1d81b6c4cf8f3be25fa.png': path.resolve(__dirname, './src/assets/9ad96818ef3777dbb7fdf1d81b6c4cf8f3be25fa.png'),
        'figma:asset/90ca834cd25d30f049184b248a5fa2cf472c95bc.png': path.resolve(__dirname, './src/assets/90ca834cd25d30f049184b248a5fa2cf472c95bc.png'),
        'figma:asset/894ea1b27a77c9b8a7866c73c9d44608bbac6d8a.png': path.resolve(__dirname, './src/assets/894ea1b27a77c9b8a7866c73c9d44608bbac6d8a.png'),
        'figma:asset/7982e25e89413acdfdc5588a1b82c90910205f0f.png': path.resolve(__dirname, './src/assets/7982e25e89413acdfdc5588a1b82c90910205f0f.png'),
        'figma:asset/79244d6dc3d64c61191868a8b41899fc8525c6f2.png': path.resolve(__dirname, './src/assets/79244d6dc3d64c61191868a8b41899fc8525c6f2.png'),
        'figma:asset/71632be70905a17fd389a8d053249645c4e8a4df.png': path.resolve(__dirname, './src/assets/71632be70905a17fd389a8d053249645c4e8a4df.png'),
        'figma:asset/6f98872cb4f9a8d97b6c2b51222167b8a0360d98.png': path.resolve(__dirname, './src/assets/6f98872cb4f9a8d97b6c2b51222167b8a0360d98.png'),
        'figma:asset/6bbce490789ed9401b274940c0210ca96c857be3.png': path.resolve(__dirname, './src/assets/6bbce490789ed9401b274940c0210ca96c857be3.png'),
        'figma:asset/6b805fdfa5d668a5a60fc3360ae7753813961bf5.png': path.resolve(__dirname, './src/assets/6b805fdfa5d668a5a60fc3360ae7753813961bf5.png'),
        'figma:asset/6b183226d37cb39ef4f3b9151960d16140733b40.png': path.resolve(__dirname, './src/assets/6b183226d37cb39ef4f3b9151960d16140733b40.png'),
        'figma:asset/69a9ed38e2c39a90d2bfb233a8f1982bfdeff3a3.png': path.resolve(__dirname, './src/assets/69a9ed38e2c39a90d2bfb233a8f1982bfdeff3a3.png'),
        'figma:asset/618daa9a68ee59f7a6ae2af4cb4c10ea44a1211f.png': path.resolve(__dirname, './src/assets/618daa9a68ee59f7a6ae2af4cb4c10ea44a1211f.png'),
        'figma:asset/5e487abc93ede172b03a538cd75dcefc0440110d.png': path.resolve(__dirname, './src/assets/5e487abc93ede172b03a538cd75dcefc0440110d.png'),
        'figma:asset/5c876de928ca711ee9770734c2254c71ec8d2988.png': path.resolve(__dirname, './src/assets/5c876de928ca711ee9770734c2254c71ec8d2988.png'),
        'figma:asset/5a3e222d04cdbb6fc8cb9e863cde9888e9436a78.png': path.resolve(__dirname, './src/assets/5a3e222d04cdbb6fc8cb9e863cde9888e9436a78.png'),
        'figma:asset/59e7f2a1730a41d8f67cd387d9fbbb43e61c2de8.png': path.resolve(__dirname, './src/assets/59e7f2a1730a41d8f67cd387d9fbbb43e61c2de8.png'),
        'figma:asset/56b756d6ebb1d78df3953fc352e19c25b394a271.png': path.resolve(__dirname, './src/assets/56b756d6ebb1d78df3953fc352e19c25b394a271.png'),
        'figma:asset/552aa6a2ab864900418cd17dabcb4627fbb80d42.png': path.resolve(__dirname, './src/assets/552aa6a2ab864900418cd17dabcb4627fbb80d42.png'),
        'figma:asset/505ec7a20e1b305a30cd4ca5d2971e8c6ecbf2bc.png': path.resolve(__dirname, './src/assets/505ec7a20e1b305a30cd4ca5d2971e8c6ecbf2bc.png'),
        'figma:asset/4ad4c017fbf91e11f444db29743f7a30ca763299.png': path.resolve(__dirname, './src/assets/4ad4c017fbf91e11f444db29743f7a30ca763299.png'),
        'figma:asset/4a74865021eb9512b59f5bc11f033af368534062.png': path.resolve(__dirname, './src/assets/4a74865021eb9512b59f5bc11f033af368534062.png'),
        'figma:asset/46588005695464b7def72a24e7bb7c324232fb8e.png': path.resolve(__dirname, './src/assets/46588005695464b7def72a24e7bb7c324232fb8e.png'),
        'figma:asset/3eb60da91b670e870d18bb6dc5f52f4e45f92329.png': path.resolve(__dirname, './src/assets/3eb60da91b670e870d18bb6dc5f52f4e45f92329.png'),
        'figma:asset/3c4f6d7cd8e52d1fbd106cc8702ba2e53af44c6f.png': path.resolve(__dirname, './src/assets/3c4f6d7cd8e52d1fbd106cc8702ba2e53af44c6f.png'),
        'figma:asset/36bc166354a0af18b92c1b4cc94416c79f3cdd6c.png': path.resolve(__dirname, './src/assets/36bc166354a0af18b92c1b4cc94416c79f3cdd6c.png'),
        'figma:asset/2fa508abd8bc61df185ff4ce820134445a5b35b5.png': path.resolve(__dirname, './src/assets/2fa508abd8bc61df185ff4ce820134445a5b35b5.png'),
        'figma:asset/288456a929894c1b68838d43c6cabf1532dcfaef.png': path.resolve(__dirname, './src/assets/288456a929894c1b68838d43c6cabf1532dcfaef.png'),
        'figma:asset/27504741573e0946b791d837bb57de9ad9c0f981.png': path.resolve(__dirname, './src/assets/27504741573e0946b791d837bb57de9ad9c0f981.png'),
        'figma:asset/23ed9cc11da84dbe8eb22e3eeb81173051f8b986.png': path.resolve(__dirname, './src/assets/23ed9cc11da84dbe8eb22e3eeb81173051f8b986.png'),
        'figma:asset/23211fe5353777e348b64b894b371ef67db44cfb.png': path.resolve(__dirname, './src/assets/23211fe5353777e348b64b894b371ef67db44cfb.png'),
        'figma:asset/2055816d9237a29b336d813b80b43778bb1a2fb9.png': path.resolve(__dirname, './src/assets/2055816d9237a29b336d813b80b43778bb1a2fb9.png'),
        'figma:asset/19b8318c4dd036819acec78c2311528585bbfe6b.png': path.resolve(__dirname, './src/assets/19b8318c4dd036819acec78c2311528585bbfe6b.png'),
        'figma:asset/1836a20ae1cb76610d3554b773af9c32ebaae548.png': path.resolve(__dirname, './src/assets/1836a20ae1cb76610d3554b773af9c32ebaae548.png'),
        'figma:asset/16f87142f626c781659c1db02943abdceac4a69c.png': path.resolve(__dirname, './src/assets/16f87142f626c781659c1db02943abdceac4a69c.png'),
        'figma:asset/10d3d015685dee0b00951bf262608d69093ccde4.png': path.resolve(__dirname, './src/assets/10d3d015685dee0b00951bf262608d69093ccde4.png'),
        'figma:asset/1019e6dc4684d37b305b45dcefe21071ebdf61a7.png': path.resolve(__dirname, './src/assets/1019e6dc4684d37b305b45dcefe21071ebdf61a7.png'),
        'figma:asset/0e944ae825916234b6dfadd9ea362b6ac507e753.png': path.resolve(__dirname, './src/assets/0e944ae825916234b6dfadd9ea362b6ac507e753.png'),
        'figma:asset/0e69cb7a2e02eae0ab4875af04918199153d3c99.png': path.resolve(__dirname, './src/assets/0e69cb7a2e02eae0ab4875af04918199153d3c99.png'),
        'figma:asset/0980bfd64c81584e7347191b955bcd26c6dd5821.png': path.resolve(__dirname, './src/assets/0980bfd64c81584e7347191b955bcd26c6dd5821.png'),
        'figma:asset/093b46b735fb2f7849e654493d93baad63b06ab7.png': path.resolve(__dirname, './src/assets/093b46b735fb2f7849e654493d93baad63b06ab7.png'),
        'figma:asset/080dc1995a18f4792c8fb8df7a8c42cff8c2c3ed.png': path.resolve(__dirname, './src/assets/080dc1995a18f4792c8fb8df7a8c42cff8c2c3ed.png'),
        'figma:asset/075935dbf0c3e993b37e29b71812432fcef83604.png': path.resolve(__dirname, './src/assets/075935dbf0c3e993b37e29b71812432fcef83604.png'),
        'figma:asset/067477e84f5320dfe83e3d768945fa2e20caeec4.png': path.resolve(__dirname, './src/assets/067477e84f5320dfe83e3d768945fa2e20caeec4.png'),
        'figma:asset/01f369f7145a1bda02cadae942ff191c7c2cda51.png': path.resolve(__dirname, './src/assets/01f369f7145a1bda02cadae942ff191c7c2cda51.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: '../build',
      minify: 'esbuild',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor';
              }
              // Radix UI components
              if (id.includes('@radix-ui')) {
                return 'ui-vendor';
              }
              // Charts
              if (id.includes('recharts')) {
                return 'chart-vendor';
              }
              // Forms
              if (id.includes('react-hook-form')) {
                return 'form-vendor';
              }
              // Icons
              if (id.includes('lucide-react')) {
                return 'icon-vendor';
              }
              // Utils
              if (id.includes('sonner') || id.includes('class-variance-authority') || id.includes('cmdk')) {
                return 'utils-vendor';
              }
              // Other node_modules
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    },
    server: {
      port: 3000,
      open: true,
    },
  });