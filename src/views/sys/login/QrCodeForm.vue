<template>
  <template v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <!-- <div class="gp mt-4 mb-2"> Tip：演示系统未开放扫码登录，请联系官方人员获取账号密码。 </div> -->
    <div class="enter-x min-h-64 min-w-64">
      <QrCode
        :value="qrCodeUrl"
        class="enter-x flex justify-center xl:justify-start"
        :width="280"
      />
      <Divider class="enter-x size">{{ t('请使用微信扫描二维码，点击图片刷新！') }}</Divider>
      <Button size="large" block class="enter-x mt-4" @click="handleBackLogin">
        {{ t('sys.login.backSignIn') }}
      </Button>
    </div>
  </template>
</template>
<script lang="ts" setup>
  import { computed, unref } from 'vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import { Button, Divider } from 'ant-design-vue';
  import { QrCode } from '/@/components/Qrcode';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useLoginState, LoginStateEnum } from './useLogin';
  import { LINK_URL } from '/@/settings/siteSetting';

  const qrCodeUrl = LINK_URL;

  const { t } = useI18n();
  const { handleBackLogin, getLoginState } = useLoginState();

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE);
</script>
