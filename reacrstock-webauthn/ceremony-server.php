<?php
declare(strict_types=1);
require __DIR__.'/vendor/autoload.php';
final class GenericWebAuthn {
  private Symfony\Component\Serializer\SerializerInterface $serializer;
  private Webauthn\AuthenticatorAttestationResponseValidator $reg;
  private Webauthn\AuthenticatorAssertionResponseValidator $auth;
  public function __construct(private string $rpId, private string $origin) {
    $att=new Webauthn\AttestationStatement\AttestationStatementSupportManager([new Webauthn\AttestationStatement\NoneAttestationStatementSupport()]);
    $this->serializer=(new Webauthn\Denormalizer\WebauthnSerializerFactory($att))->create();
    $factory=new Webauthn\CeremonyStep\CeremonyStepManagerFactory();
    $factory->setAllowedOrigins([$origin]);
    $this->reg=Webauthn\AuthenticatorAttestationResponseValidator::create($factory->creationCeremony());
    $this->auth=Webauthn\AuthenticatorAssertionResponseValidator::create($factory->requestCeremony());
  }
  public function registrationOptions(string $handle): array {
    $o=Webauthn\PublicKeyCredentialCreationOptions::create(
      Webauthn\PublicKeyCredentialRpEntity::create('Credential Test',$this->rpId),
      Webauthn\PublicKeyCredentialUserEntity::create('admin',$handle,'Administrator'),
      random_bytes(32),
      [Webauthn\PublicKeyCredentialParameters::createPk(-7),Webauthn\PublicKeyCredentialParameters::createPk(-257)],
      Webauthn\AuthenticatorSelectionCriteria::create(authenticatorAttachment:null,userVerification:Webauthn\AuthenticatorSelectionCriteria::USER_VERIFICATION_REQUIREMENT_REQUIRED,residentKey:Webauthn\AuthenticatorSelectionCriteria::RESIDENT_KEY_REQUIREMENT_REQUIRED),
      Webauthn\PublicKeyCredentialCreationOptions::ATTESTATION_CONVEYANCE_PREFERENCE_NONE,
      [],300000
    );
    return json_decode($this->serializer->serialize($o,'json'),true,512,JSON_THROW_ON_ERROR);
  }
  public function verifyRegistration(array $c,array $o,string $handle): string {
    $cred=$this->serializer->deserialize(json_encode($c,JSON_THROW_ON_ERROR),Webauthn\PublicKeyCredential::class,'json');
    $opts=$this->serializer->deserialize(json_encode($o,JSON_THROW_ON_ERROR),Webauthn\PublicKeyCredentialCreationOptions::class,'json');
    if(!$cred instanceof Webauthn\PublicKeyCredential || !$cred->response instanceof Webauthn\AuthenticatorAttestationResponse || !$opts instanceof Webauthn\PublicKeyCredentialCreationOptions) throw new RuntimeException('bad registration payload');
    $record=$this->reg->check($cred->response,$opts,$this->rpId);
    if(!hash_equals($handle,$record->userHandle)) throw new RuntimeException('handle mismatch');
    return $this->serializer->serialize($record,'json');
  }
  public function authenticationOptions(): array {
    $o=Webauthn\PublicKeyCredentialRequestOptions::create(random_bytes(32),$this->rpId,[],Webauthn\PublicKeyCredentialRequestOptions::USER_VERIFICATION_REQUIREMENT_REQUIRED,300000);
    return json_decode($this->serializer->serialize($o,'json'),true,512,JSON_THROW_ON_ERROR);
  }
  public function verifyAuthentication(array $c,array $o,string $recordJson,string $handle): string {
    $cred=$this->serializer->deserialize(json_encode($c,JSON_THROW_ON_ERROR),Webauthn\PublicKeyCredential::class,'json');
    $opts=$this->serializer->deserialize(json_encode($o,JSON_THROW_ON_ERROR),Webauthn\PublicKeyCredentialRequestOptions::class,'json');
    $record=$this->serializer->deserialize($recordJson,Webauthn\CredentialRecord::class,'json');
    if(!$cred instanceof Webauthn\PublicKeyCredential || !$cred->response instanceof Webauthn\AuthenticatorAssertionResponse || !$opts instanceof Webauthn\PublicKeyCredentialRequestOptions || !$record instanceof Webauthn\CredentialRecord) throw new RuntimeException('bad auth payload');
    if(!hash_equals($handle,$record->userHandle)) throw new RuntimeException('handle mismatch');
    $updated=$this->auth->check($record,$cred->response,$opts,$this->rpId,$record->userHandle);
    return $this->serializer->serialize($updated,'json');
  }
}
function b64e(string $s): string { return rtrim(strtr(base64_encode($s),'+/','-_'),'='); }
function statePath(string $n): string { return sys_get_temp_dir().'/generic-webauthn-'.$n.'.json'; }
function saveState(string $n,mixed $v): void { file_put_contents(statePath($n),json_encode($v,JSON_THROW_ON_ERROR)); }
function loadState(string $n): mixed { return json_decode((string)file_get_contents(statePath($n)),true,512,JSON_THROW_ON_ERROR); }
function body(): array { $x=json_decode((string)file_get_contents('php://input'),true); return is_array($x)?$x:[]; }
$origin='http://127.0.0.1:18779'; $wa=new GenericWebAuthn('127.0.0.1',$origin); $a=$_GET['action']??'';
header('Content-Type: application/json');
try {
  if($a==='reg-options'){ $h=random_bytes(32); saveState('handle',b64e($h)); $o=$wa->registrationOptions($h); saveState('reg-options',$o); echo json_encode(['publicKey'=>$o]); exit; }
  if($a==='reg-verify'){ $h=base64_decode(strtr(loadState('handle').str_repeat('=',(4-strlen(loadState('handle'))%4)%4),'-_','+/')); $r=$wa->verifyRegistration(body()['credential']??[],loadState('reg-options'),$h); saveState('record',$r); echo json_encode(['ok'=>true]); exit; }
  if($a==='auth-options'){ $o=$wa->authenticationOptions(); saveState('auth-options',$o); echo json_encode(['publicKey'=>$o]); exit; }
  if($a==='auth-verify'){ $hb=loadState('handle'); $h=base64_decode(strtr($hb.str_repeat('=',(4-strlen($hb)%4)%4),'-_','+/')); $r=$wa->verifyAuthentication(body()['credential']??[],loadState('auth-options'),(string)file_get_contents(statePath('record')),$h); saveState('record',$r); echo json_encode(['ok'=>true]); exit; }
  echo json_encode(['ok'=>true,'service'=>'generic-webauthn-ceremony']);
} catch(Throwable $e){ http_response_code(401); echo json_encode(['ok'=>false,'error'=>$e->getMessage()]); }
