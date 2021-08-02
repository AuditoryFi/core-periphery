const AuditoryRouter = artifacts.require("AuditoryRouter.sol");
const AuditoryApManager = artifacts.require("AuditoryApManager.sol");

module.exports = async function (deployer, _network, _addresses) {
  await deployer.deploy(AuditoryApManager);
  await deployer.deploy(AuditoryRouter);
};
