<template>
  <div v-if="props.sidebar" :class="`${prefixCls}-sidebar md:hidden lg:block think gem`">
    <span :class="[prefixCls, `${prefixCls}--${props.theme}`]" class="flex">
      <img :class="`${prefixCls}__header`" :src="getUserInfo.avatarUrl" />
      <span :class="`${prefixCls}__info`">
        <span :class="`${prefixCls}__name`" class="truncate">
          {{ getUserInfo.name }}
        </span>
        <span :class="`${prefixCls}__authority`" class="block">
          {{ authorityLabel }}
        </span>
        <span :class="`${prefixCls}__btns`" class="block">
          <a class="online"><Icon icon="i-fa:circle" /> {{ t('layout.header.sidebarOnline') }}</a>
          <a class="logout" @click="handleLoginOut">
            <Icon icon="i-fa:sign-out" /> {{ t('layout.header.sidebarLogout') }}
          </a>
        </span>
      </span>
    </span>
  </div>
  <Dropdown v-else placement="bottom" :overlayClassName="`${prefixCls}-dropdown-overlay`">
    <span :class="[prefixCls, `${prefixCls}--${props.theme}`]" class="flex">
      <img :class="`${prefixCls}__header`" :src="getUserInfo.avatarUrl" />
      <span :class="`${prefixCls}__info hidden md:block`">
        <div :class="`${prefixCls}__name`" class="truncate">
          {{ getUserInfo.firstName || getUserInfo.name }}
        </div>
        <div :class="`${prefixCls}__authority`">
          {{ authorityLabel }}
        </div>
      </span>
    </span>
    <template #overlay>
      <Menu @click="handleMenuClick">
        <MenuItem
          value="accountCenter"
          :text="t('sys.account.center')"
          icon="i-ion:person-outline"
        />
        <MenuItem value="modifyPwd" :text="t('sys.account.modifyPwd')" icon="i-ion:key-outline" />
        <MenuDivider />
        <MenuItem
          value="doc"
          :text="t('layout.header.dropdownItemDoc')"
          icon="i-ion:document-text-outline"
          v-if="getShowDoc"
        />
        <MenuDivider v-if="getShowDoc" />
        <MenuItem
          v-if="getUseLockPage"
          value="lock"
          :text="t('layout.header.tooltipLock')"
          icon="i-ion:lock-closed-outline"
        />
        <MenuItem
          value="logout"
          :text="t('layout.header.dropdownItemLoginOut')"
          icon="i-ion:power-outline"
        />
      </Menu>
    </template>
  </Dropdown>
  <LockAction v-if="!props.sidebar" @register="registerModal" />
</template>
<script lang="ts">
  import { defineComponent, computed, ref, onMounted } from 'vue';
  import { Dropdown, Menu } from 'ant-design-vue';
  import { DOC_URL } from '/@/settings/siteSetting';
  import { useUserStore } from '/@/store/modules/user';
  import { useHeaderSetting } from '/@/hooks/setting/useHeaderSetting';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useModal } from '/@/components/Modal';
  import { useGo } from '/@/hooks/web/usePage';
  import { propTypes } from '/@/utils/propTypes';
  import { openWindow } from '/@/utils';
  import { Authority, AUTHORITY_OPTIONS } from '/@/enums/authorityEnum';
  import { PageEnum } from '/@/enums/pageEnum';
  import { Icon } from '/@/components/Icon';
  import MenuItem from './DropMenuItem.vue';
  import LockAction from '../lock/LockModal.vue';
  import { NULL_UUID } from '/@/enums/constant';

  type MenuEvent = 'accountCenter' | 'modifyPwd' | 'logout' | 'doc' | 'lock' | 'roleCode-';

  const props = {
    theme: propTypes.oneOf(['dark', 'light']),
    sidebar: propTypes.bool.def(false),
  };

  export default defineComponent({
    name: 'UserDropdown',
    components: {
      Dropdown,
      Menu,
      MenuItem,
      MenuDivider: Menu.Divider,
      LockAction,
      Icon,
    },
    props,
    setup(props: any) {
      const { prefixCls } = useDesign('header-user-dropdown');
      const { t } = useI18n();
      const { getShowDoc, getUseLockPage } = useHeaderSetting();
      const userStore = useUserStore();
      const go = useGo();

      const authorityRef = ref<Authority | undefined>();
      const tenantIdRef = ref<string>('');
      const customerIdRef = ref<string>('');

      const getUserInfo = computed(() => {
        const {
          name = '',
          email,
          firstName,
          lastName,
          phone,
          authority,
          additionalInfo,
        } = userStore.getUserInfo || {};
        return {
          name,
          email,
          firstName,
          lastName,
          phone,
          authority,
          avatarUrl: additionalInfo?.avatarUrl,
        };
      });

      const authorityLabel = computed(() => {
        return AUTHORITY_OPTIONS.find((item) => item.value == getUserInfo.value.authority)?.label;
      });

      if (!props.sidebar) {
        onMounted(async () => {
          authorityRef.value = userStore.getPageCacheByKey('authority', Authority.CUSTOMER_USER);
          tenantIdRef.value = userStore.getPageCacheByKey('tenantId', NULL_UUID);
          customerIdRef.value = userStore.getPageCacheByKey('customerId', NULL_UUID);
        });
      }

      const [registerModal, { openModal }] = useModal();

      function handleLoginOut() {
        userStore.confirmLoginOut();
      }

      function handleAccountCenter() {
        go('/account/center');
      }

      function handleModifyPwd() {
        go('/account/center');
      }

      function handleOpenDoc() {
        openWindow(DOC_URL);
      }

      function handleLock() {
        openModal(true);
      }

      async function handleMenuClick(e: { key: MenuEvent } | any) {
        switch (e.key) {
          case 'accountCenter':
            handleAccountCenter();
            break;
          case 'modifyPwd':
            handleModifyPwd();
            break;
          case 'logout':
            handleLoginOut();
            break;
          case 'doc':
            handleOpenDoc();
            break;
          case 'lock':
            handleLock();
            break;
          default:
            break;
        }
      }

      return {
        prefixCls,
        t,
        getUserInfo,
        authorityLabel,
        handleMenuClick,
        getShowDoc,
        registerModal,
        getUseLockPage,
        handleLoginOut,
        props,
      };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'jeesite-header-user-dropdown';
  @menu-dark-subsidiary-color: rgba(255, 255, 255, 0.7);

  .@{prefix-cls} {
    height: @header-height;
    padding: 0 0 0 10px;
    padding-right: 10px;
    overflow: hidden;
    font-size: 12px;
    cursor: pointer;
    align-items: center;

    img {
      width: 24px;
      height: 24px;
      margin-right: 10px;
      background: #eee;
    }

    &__header {
      border-radius: 50%;
    }

    &__name {
      font-size: 14px;
      line-height: 20px;
    }

    &__authority {
      font-size: 12px;
      line-height: 24px;
    }

    &--dark {
      &:hover {
        background-color: @header-dark-bg-hover-color;
      }

      .@{prefix-cls}__info {
        color: @menu-dark-subsidiary-color;
      }

      .@{prefix-cls}__desc {
        color: @menu-dark-subsidiary-color;
      }
    }

    &--light {
      &:hover {
        background-color: @header-light-bg-hover-color;
      }

      .@{prefix-cls}__info {
        color: @text-color-base;
      }

      .@{prefix-cls}__desc {
        color: @header-light-desc-color;
      }
    }

    &-dropdown-overlay {
      .ant-dropdown-menu-item {
        min-width: 115px;
      }
    }

    &-menu-subtitle {
      line-height: 13px;

      span {
        font-weight: bold;
        opacity: 0.7;

        svg {
          padding-top: 3px;
        }
      }
    }

    &-sidebar {
      .@{prefix-cls} {
        height: auto;
        cursor: default;
        padding: 8px 10px 10px;

        img {
          width: 45px;
          height: 45px;
          transition: all 0.1s;
        }

        &__name {
          font-weight: bold;
        }

        &__authority {
          font-weight: bold;
        }

        &__btns {
          padding-top: 3px;
          font-size: 11px;
          white-space: nowrap;

          .anticon {
            padding-right: 2px;
          }

          .online {
            padding-right: 9px;

            .anticon {
              color: #3c763d;
            }
          }

          .logout {
            .anticon {
              color: #a94442;
            }
          }
        }

        &--dark {
          color: @menu-dark-subsidiary-color;

          a {
            color: @menu-dark-subsidiary-color;
          }

          &:hover {
            background-color: transparent;
          }
        }

        &--light {
          color: @text-color-base;

          a {
            color: @text-color-base;
          }

          &:hover {
            background-color: transparent;
          }
        }
      }
    }
  }

  .ant-layout-sider-collapsed {
    .@{prefix-cls} {
      padding: 10px 0;
      justify-content: center;

      img {
        width: 25px;
        height: 25px;
        margin: 0;
      }

      &__info {
        display: none;
      }
    }
  }
</style>
